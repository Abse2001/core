import { PcbTrace } from "lib/components/primitive-components/PcbTrace"
import type { InflatorContext } from "../InflatorFn"
import type { PcbTrace as PcbTraceElement } from "circuit-json"

/**
 * Preserve routed PCB traces from circuitJson by seeding the subcircuit's
 * pcbRouteCache. This lets trace rendering reuse existing routes instead of
 * rerouting from scratch.
 */
export const inflatePcbTrace = (
  pcbTrace: PcbTraceElement,
  inflatorContext: InflatorContext,
) => {
  const { subcircuit } = inflatorContext

  subcircuit.add(
    new PcbTrace({
      route: pcbTrace.route,
      source_trace_id: pcbTrace.source_trace_id,
    }),
  )
}
