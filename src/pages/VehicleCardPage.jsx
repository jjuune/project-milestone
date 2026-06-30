import { Link, useNavigate, useParams } from 'react-router-dom'

// TODO (3단계): Supabase에서 차량 상세 + vehicle_events 타임라인 가져오기
const MOCK_VEHICLES = ['1', '2', '3']

const MOCK_EVENTS = [
  { id: 'e1', date: '2026.06.24', type: '엔진오일 교체', mileage: '50,000km' },
  { id: 'e2', date: '2026.03.11', type: '와이퍼 교체', mileage: '47,300km' },
  { id: 'e3', date: '2025.11.08', type: '타이어 교체', mileage: '41,000km' },
]

export default function VehicleCardPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const currentIndex = MOCK_VEHICLES.indexOf(id)

  const goToVehicle = (direction) => {
    const nextIndex =
      (currentIndex + direction + MOCK_VEHICLES.length) % MOCK_VEHICLES.length
    navigate(`/vehicle/${MOCK_VEHICLES[nextIndex]}`)
  }

  return (
    <div className="vehicle-card-page">
      <header className="vehicle-card-header">
        <Link to="/" className="back-link">
          ←
        </Link>
        {/* TODO: 차량 이미지, 차량명, 현재 누적거리 표시 */}
        <h1>차량 #{id}</h1>
        <Link to={`/vehicle/${id}/wallet`} className="wallet-link">
          📋 차량 정보
        </Link>
      </header>

      {/* 좌우 스와이프 영역 — 지금은 버튼으로 임시 구현, 추후 터치 스와이프로 교체 */}
      <div className="swipe-controls">
        <button onClick={() => goToVehicle(-1)}>←</button>
        <button onClick={() => goToVehicle(1)}>→</button>
      </div>

      <section className="condition-tracker">
        {/* TODO: 엔진오일/브레이크/타이어 게이지 (소모품 상태) */}
        <p>소모품 상태 (구현 예정)</p>
      </section>

      <section className="quick-input">
        {/* TODO: [+] 10초 퀵 입력 폼 진입 버튼 */}
        <button className="add-event-button">+ 기록하기</button>
      </section>

      <section className="vehicle-timeline">
        <h2>타임라인</h2>
        {MOCK_EVENTS.map((event) => (
          <div key={event.id} className="timeline-item">
            <span className="timeline-date">{event.date}</span>
            <span className="timeline-type">{event.type}</span>
            <span className="timeline-mileage">{event.mileage}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
