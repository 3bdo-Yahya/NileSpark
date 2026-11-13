import { Dialog } from '../../components/ui/Dialog'

export function MethodDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Know what you are comparing.">
      <p>
        <strong>Source observations</strong> retain their sensor-specific meaning. NASA Standard
        Processing is not the cross-sensor harmonization planned for BurnCal.
      </p>
      <p>
        <strong>Harmonized data</strong> will use the science team’s approved metric, unit, coverage
        rules and method. It is not implemented by this frontend.
      </p>
      <p>
        <strong>This demo is synthetic.</strong> Generated record counts, point locations and
        availability examples only demonstrate the interface. They are not NASA observations, unique
        fire counts, risk, burned area or a validated activity index.
      </p>
      <p>
        A dash means unavailable in the fixture; zero is an explicit generated-zero example. Neither
        proves real-world coverage.
      </p>
      <a href="https://firms.modaps.eosdis.nasa.gov/country/" target="_blank" rel="noreferrer">
        NASA FIRMS source archive <span className="sr-only">(opens in a new tab)</span>↗
      </a>
    </Dialog>
  )
}
