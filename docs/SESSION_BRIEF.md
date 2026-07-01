# PITSTOP 세션 브리핑

> 새 대화 시작 시 이 문서를 첨부하면 이전 맥락을 그대로 이어갈 수 있습니다.
> 마지막 업데이트: 2026-07-01

---

## 프로젝트 개요

**PITSTOP** (코드네임: Milestone)
> "아 뭐였더라?"를 없애는 차량 관리 경험

- 소규모 사업장(1~5대) 법인 차량의 정비/소모품 이력을 기록하고, 필요한 시점에 알림을 제공하는 PWA
- 배차관리·운행일지·ERP는 의도적으로 제외 (README 3번 "하지 않는 것" 참고)
- GitHub: https://github.com/jjuune/project-milestone

---

## 기술 스택

| 역할 | 선택 | 비고 |
| :--- | :--- | :--- |
| Frontend | Vite + React (PWA) | vite-plugin-pwa, react-router-dom |
| Backend / DB | Supabase | Auth, RLS, Edge Functions(예정) |
| NAS (Synology DS920+) | 백업 전용 | Supabase DB 정기 덤프 저장 |
| n8n | 부가 자동화 (선택) | 텔레그램 알림 중계 등, 핵심 기능과 분리 |

---

## 화면 구조 (라우팅)

```
/                        Dashboard — 전체 차량 요약 + 상태
/vehicle/:id              Vehicle Card — 차량 상세 + 소모품 게이지 + 타임라인 + 퀵 입력
/vehicle/:id/wallet        Vehicle Wallet — 보험사, 검사일 등 정적 정보 (가끔 열람)
```

---

## DB 스키마 (핵심 테이블 5개)

- `organizations` — 회사 단위 (권한의 기준점)
- `profiles` — 직원 정보 (Supabase Auth 확장, display_name, organization_id)
- `vehicles` — 차량 기본 정보 + `current_mileage` 캐시 컬럼
- `vehicle_wallets` — 차량 정적 정보 (vehicles와 1:1 분리 보관)
- `vehicle_events` — 모든 이벤트 통합 기록 (교체/갱신/거리입력 등)

**트리거**: `vehicle_events` INSERT 시 `vehicles.current_mileage` 자동 갱신
**뷰**: `mileage_timeline` (운행일지 참고 대비 사전 정의)

---

## 권한 구조 (RLS)

- **원칙**: 같은 organization 소속이면 모든 차량 조회/수정 가능 (차량별 세분화 없음)
- **추적**: `vehicle_events.recorded_by`로 기록자 자동 추적 (의심이 아니라 "누구한테 확인할지" 용도)
- **외부인**: 시스템 접근 없음, 내부 직원이 대리 기록 + 메모로 맥락 남김

### 적용된 RLS 정책
```sql
-- vehicles, vehicle_wallets, vehicle_events: organization 단위 접근
-- profiles: 본인 행만 SELECT 가능 ← 이게 없으면 위 세 테이블의 서브쿼리가 막힘 (실제 겪은 버그)
CREATE POLICY "본인 프로필 조회 가능" ON profiles
  FOR SELECT USING (id = auth.uid());
```

> ⚠️ profiles의 SELECT 정책이 없으면 vehicles/vehicle_events RLS 서브쿼리가 0건을 반환함
> → 실제로 이 버그를 겪었고 해결 완료

---

## 인증 / 세션

- **방식**: 이메일 + 비밀번호 (매직링크 아님 — 익숙하지 않은 직원 배려)
- **세션 유지**: Refresh Token 기반 자동 유지 (며칠 만에 열어도 로그인 화면 안 뜸)
- **만료 정책**: 퇴사 시에만 Supabase 콘솔에서 수동 강제 로그아웃
- **신규 직원 등록**: Supabase 콘솔에서 Auth 계정 생성 후, profiles 테이블에 직접 INSERT

---

## 완료된 작업

### 1단계: DB 스키마 + Auth/RLS 설계 ✅
- 5개 테이블 + 트리거 + 뷰 + RLS 정책 설계 확정
- 문서: `docs/01_DB_설계_결정정리.md`, `docs/02_DB_스키마_SQL.md`

### 2단계: PWA 골격 + 라우팅 + 로그인 ✅
- Vite + React PWA 세팅 완료
- 이메일/비밀번호 로그인 + RequireAuth 가드
- 3개 화면 라우팅 골격 완성

### 3단계: 실데이터 연동 + 퀵 입력 폼 ✅
- Dashboard, VehicleCard, VehicleWallet 전부 실제 Supabase 데이터 연동
- `src/lib/maintenanceStatus.js` — 소모품 상태 계산 공용 로직
- `src/components/EventForm.jsx` — 10초 퀵 입력 폼
  - 이벤트 선택 → 거리 입력 → 변화량 컨펌 → 저장
  - 직전 대비 감소 시 경고 표시 (막지는 않음, "방지"가 아니라 "자기 확인" 원칙)
  - `recorded_by` 자동 기록 (로그인 세션에서 자동 추출)

### 실제 검증 완료 항목 ✅
- 로그인/세션 유지
- Dashboard 차량 목록 (소모품 상태 요약 포함)
- Vehicle Card 좌우 스와이프 (전차량 전환)
- 소모품 게이지 표시
- 이벤트 기록 저장 (메모 포함)
- 거리 감소 감지 경고
- 타임라인 출력
- `current_mileage` 트리거 자동 갱신 확인

---

## 남은 작업 (V1)

### 4단계: 알림 시스템
- Supabase Edge Function + pg_cron으로 일 1회 상태 계산
- 거리 기반: 엔진오일/타이어/브레이크
- 날짜 기반: 보험 갱신/정기검사
- V1 범위: 대시보드 내 표시까지만 (푸시/텔레그램 발송은 확장 포인트로 남김)

### 5단계: Wallet 편집 + 긴급출동 마무리
- 현재 Wallet은 조회만 가능, 편집 화면 없음 (지금은 Supabase 콘솔에서 직접 입력)
- 긴급출동 버튼 (`tel:` 링크) — 코드는 있으나 emergency_number 입력 필요
- 전체 플로우 통합 테스트

---

## 보류 항목 (건드리지 말 것)

| 항목 | 이유 | 재개 조건 |
| :--- | :--- | :--- |
| Epic 4: 운행일지 자동생성 | 법적 리스크 (패턴 기반 가상 생성) | 세무사 확인 후 |
| NFC 트리거 | MVP 사용성 미검증 | V1 사용 후 편의성 판단 시 |
| 회원가입 화면 | 직원 수가 적어 콘솔 직접 등록으로 충분 | 인원 증가 시 |
| profiles 자동 생성 트리거 | 동일 이유 | 인원 증가 시 |

---

## 확정된 설계 결정 (Gemini 등 외부 제안 시 변경 금지)

- `vehicle_events`에 주행거리 입력 통합 (별도 `mileage_logs` 테이블 없음)
- `current_mileage` 캐시 컬럼은 DB 트리거로만 갱신 (프론트엔드 직접 UPDATE 금지)
- `event_type`은 VARCHAR + 앱 레벨 검증 (ENUM 아님, 확장성 우선)
- organization 단위 전체 공유 권한 (`vehicle_members` 테이블 없음)
- 관리자 인증은 Supabase Auth 활용 (SHA-256 자체 구현 없음)
- 디자인은 V1 전체 기능 완성 후 적용

---

## 역할 분담

| 역할 | 담당 |
| :--- | :--- |
| 기획 / 설계 / PM | Claude (이 대화의 맥락 보유자) |
| 코딩 서포트 | Gemini |
| 제안 필터링 (1차) | jjuune 본인 |

> Gemini의 코드 수정 제안은 설계 방향과 충돌 가능성이 있으므로,
> 기획/설계 영역의 변경은 반드시 이 대화(Claude)에서 먼저 검토 후 반영