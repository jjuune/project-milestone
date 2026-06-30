import { Link, useParams } from 'react-router-dom'

// TODO (3단계): Supabase에서 vehicle_wallets 데이터 가져오기
const MOCK_WALLET = {
  plateNumber: '12가 3456',
  model: '기아 K8',
  fuelType: '가솔린',
  insuranceCompany: '○○보험',
  insuranceExpiry: '2026.12.01',
  emergencyNumber: '1588-0000',
  inspectionDueDate: '2026.07.07',
  memo: '',
}

export default function VehicleWalletPage() {
  const { id } = useParams()

  return (
    <div className="vehicle-wallet-page">
      <header className="wallet-header">
        <Link to={`/vehicle/${id}`} className="back-link">
          ←
        </Link>
        <h1>차량 정보</h1>
      </header>

      <section className="wallet-info">
        <dl>
          <dt>차량번호</dt>
          <dd>{MOCK_WALLET.plateNumber}</dd>

          <dt>차종</dt>
          <dd>{MOCK_WALLET.model}</dd>

          <dt>연료</dt>
          <dd>{MOCK_WALLET.fuelType}</dd>

          <dt>보험사</dt>
          <dd>{MOCK_WALLET.insuranceCompany}</dd>

          <dt>보험 만기일</dt>
          <dd>{MOCK_WALLET.insuranceExpiry}</dd>

          <dt>정기검사 예정일</dt>
          <dd>{MOCK_WALLET.inspectionDueDate}</dd>
        </dl>

        <a href={`tel:${MOCK_WALLET.emergencyNumber}`} className="emergency-call-button">
          📞 긴급출동 ({MOCK_WALLET.emergencyNumber})
        </a>
      </section>
    </div>
  )
}
