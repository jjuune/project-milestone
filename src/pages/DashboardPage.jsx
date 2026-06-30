import { Link } from 'react-router-dom'

// TODO (3단계): Supabase에서 차량 목록 + 상태 데이터 가져와서 표시
const MOCK_VEHICLES = [
  { id: '1', name: 'K8', status: 'warning', statusLabel: '엔진오일 850km 남음' },
  { id: '2', name: '스타리아', status: 'ok', statusLabel: '정상' },
  { id: '3', name: '봉고', status: 'danger', statusLabel: '정기검사 D-12' },
]

export default function DashboardPage() {
  const actionNeeded = MOCK_VEHICLES.filter((v) => v.status === 'danger')

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>PITSTOP</h1>
      </header>

      {actionNeeded.length > 0 && (
        <div className="action-banner">
          🚨 조치 필요 {actionNeeded.length}건
        </div>
      )}

      <section className="vehicle-summary">
        <p>차량 {MOCK_VEHICLES.length}대</p>
        {/* TODO: 정상/확인 필요/조치 필요 카운트 집계 표시 */}
      </section>

      <section className="vehicle-list">
        {MOCK_VEHICLES.map((vehicle) => (
          <Link
            key={vehicle.id}
            to={`/vehicle/${vehicle.id}`}
            className={`vehicle-list-item status-${vehicle.status}`}
          >
            <span className="vehicle-name">{vehicle.name}</span>
            <span className="vehicle-status">{vehicle.statusLabel}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
