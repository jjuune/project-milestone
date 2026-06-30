-- ==========================================
-- 스마트 차계부 (Vehicle Log) Supabase 스키마
-- ==========================================

-- 1. 차량 정보 테이블
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    purchase_date DATE NOT NULL,
    initial_mileage INT DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 주행거리 기록 테이블
CREATE TABLE IF NOT EXISTS mileage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    mileage INT NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 소모품 정비/교체 기록 테이블
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    mileage INT NOT NULL,
    performed_at DATE NOT NULL,
    cost INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 성능 최적화를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mileage_logs_vehicle_id ON mileage_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_logged_at ON mileage_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_vehicle_id ON maintenance_logs(vehicle_id);

-- 예시 차량 데이터 삽입 (선택 사항 - 필요시 주석 해제 후 실행)
-- INSERT INTO vehicles (name, model, purchase_date, initial_mileage) 
-- VALUES ('아방이', '현대 아반떼 CN7', '2023-05-10', 10);
