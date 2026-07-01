# PITSTOP V1 — DB 스키마 (SQL)

> 1단계 설계 결정(`01_DB_설계_결정정리.md`) 기반 실제 적용 쿼리
> 대상: Supabase (PostgreSQL)
> 적용 순서: 위에서 아래로 순서대로 실행

---

## 1. 조직 (organizations)

회사 단위. 모든 권한 구조의 기준점.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

---

## 2. 사용자 프로필 (profiles)

Supabase Auth(`auth.users`)를 확장하는 테이블. 로그인 자체는 Supabase Auth가 처리하고, 여기에는 조직 소속 정보와 표시 이름만 저장.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

---

## 3. 차량 (vehicles)

```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(255),
    fuel_type VARCHAR(20) NOT NULL DEFAULT 'gasoline',  -- gasoline | diesel | ev | hybrid
    image_url TEXT,
    current_mileage INT NOT NULL DEFAULT 0,             -- 캐시 컬럼 (트리거로 자동 갱신, 4번 참고)
    is_active BOOLEAN DEFAULT true,                     -- 폐차/매각 시 소프트 삭제용
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

---

## 4. Vehicle Wallet (vehicle_wallets)

차량의 고정 정보. `vehicles`와 1:1이지만 의도적으로 분리 보관.

```sql
CREATE TABLE vehicle_wallets (
    vehicle_id UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
    plate_number VARCHAR(20),
    insurance_company VARCHAR(100),
    insurance_expiry DATE,
    emergency_number VARCHAR(20),
    inspection_due_date DATE,
    tire_spec VARCHAR(50),                  -- 향후 확장 대비
    battery_spec VARCHAR(50),               -- 향후 확장 대비
    memo TEXT,
    registration_photo_url TEXT,            -- V2 대비, NULL 허용
    insurance_policy_photo_url TEXT,        -- V2 대비, NULL 허용
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

---

## 5. Vehicle Event (vehicle_events)

차량에 일어나는 모든 일을 시간순으로 기록하는 핵심 테이블. 단순 거리 입력도 이벤트 종류 중 하나로 통합.

```sql
CREATE TABLE vehicle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    recorded_by UUID REFERENCES profiles(id) NOT NULL,
    event_type VARCHAR(30) NOT NULL,
        -- 'mileage_update' | 'engine_oil' | 'tire' | 'brake' | 'battery'
        -- | 'wiper' | 'insurance_renewal' | 'inspection' | 'other'
        -- ※ ENUM 대신 VARCHAR + 애플리케이션(입력 폼 드롭다운) 레벨 검증
        --   향후 세분화 항목 추가 시 마이그레이션 불필요
    mileage INT NOT NULL,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    memo TEXT,                              -- 외부인 대리 기록 등 맥락 기록용
    receipt_url TEXT,                       -- V1.5 사진 첨부 대비, NULL 허용
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 타임라인 조회 성능을 위한 인덱스
CREATE INDEX idx_vehicle_events_vehicle_date
    ON vehicle_events(vehicle_id, event_date DESC);
```

---

## 6. 현재 누적거리 자동 갱신 (트리거)

새 이벤트가 들어올 때마다 `vehicles.current_mileage`를 자동으로 최신화. 갱신 주체를 DB로 고정해 동시 입력 충돌을 방지하고, 입력 순서가 아닌 **실제 이벤트 날짜 기준**으로 최신값을 유지.

```sql
CREATE OR REPLACE FUNCTION update_vehicle_current_mileage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehicles
    SET current_mileage = (
        SELECT mileage FROM vehicle_events
        WHERE vehicle_id = NEW.vehicle_id
        ORDER BY event_date DESC, created_at DESC
        LIMIT 1
    )
    WHERE id = NEW.vehicle_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_mileage
AFTER INSERT ON vehicle_events
FOR EACH ROW EXECUTE FUNCTION update_vehicle_current_mileage();
```

---

## 7. 향후 운행일지 참고 대비 (뷰)

현재는 사용하지 않지만, 추후 거리 입력 이력만 따로 참고해야 할 경우를 대비해 미리 정의. 테이블 분리 없이 조회 시점에만 필터링.

```sql
CREATE VIEW mileage_timeline AS
SELECT vehicle_id, mileage, event_date, recorded_by
FROM vehicle_events
ORDER BY vehicle_id, event_date;
```

---

## 8. 권한 정책 (RLS)

"같은 조직 소속이면 모든 차량에 대해 조회/수정 가능" — 차량별 세분화된 권한 없이 조직 단위로 단순화.

```sql
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_access_vehicles ON vehicles
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY org_access_wallets ON vehicle_wallets
    FOR ALL USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE organization_id =
                (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY org_access_events ON vehicle_events
    FOR ALL USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE organization_id =
                (SELECT organization_id FROM profiles WHERE id = auth.uid())
        )
    );

-- profiles: 본인 행 조회 허용
-- (vehicles/vehicle_events RLS 정책의 서브쿼리가 이 정책에 의존함)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 프로필 조회 가능" ON profiles
  FOR SELECT USING (id = auth.uid());

```

---

## 📌 적용 시 참고사항

- 실행 순서: organizations → profiles → vehicles → vehicle_wallets → vehicle_events → 트리거 → 뷰 → RLS (외래키 의존성 순서)
- `profiles`는 Supabase Auth 가입 시점에 트리거로 자동 생성하는 방식을 권장 (V1 구현 단계에서 별도 설계)
- `event_type` 허용값 목록은 프론트엔드 입력 폼(드롭다운)에서 관리 — DB 레벨 CHECK 제약은 두지 않음 (유연성 우선)
