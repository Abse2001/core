import { expect, test } from "bun:test"
import type {
  AnyCircuitElement,
  CircuitJson,
  PcbBoard,
  PcbTrace,
} from "circuit-json"
import boardJsonRaw from "tests/components/normal-components/assets/simple-circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const boardJson = boardJsonRaw as CircuitJson
const isPcbTrace = (el: AnyCircuitElement): el is PcbTrace =>
  el.type === "pcb_trace"
const isPcbBoard = (el: AnyCircuitElement): el is PcbBoard =>
  el.type === "pcb_board"
const inputTrace = boardJson.find(isPcbTrace)

if (!inputTrace) {
  throw new Error("Expected fixture to include a pcb_trace element")
}

// When circuitJson is provided we should reuse the provided routing/placement and
// not invoke packing/autorouting. This should hold both for standalone boards and
// for boards placed inside a panel with offsets.
test("circuitJson board reuses provided traces without running algorithms", async () => {
  const { circuit } = getTestFixture()

  let autoroutingStartCount = 0
  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  let packingStartCount = 0
  circuit.on("packing:start", () => {
    packingStartCount++
  })

  circuit.add(<board circuitJson={boardJson} />)

  await circuit.renderUntilSettled()

  const renderedCircuitJson = circuit.getCircuitJson()
  const boards = renderedCircuitJson.filter(isPcbBoard)
  const pcbTraces = renderedCircuitJson.filter(isPcbTrace)

  expect(boards.length).toBe(1)
  expect(pcbTraces.length).toBe(1)

  pcbTraces[0].route.forEach((point, idx) => {
    const expectedPoint = inputTrace.route[idx]
    expect(point.x - boards[0].center.x).toBeCloseTo(expectedPoint.x)
    expect(point.y - boards[0].center.y).toBeCloseTo(expectedPoint.y)
  })

  expect(autoroutingStartCount).toBe(0)
  expect(packingStartCount).toBe(0)
  expect(renderedCircuitJson).toMatchPcbSnapshot(import.meta.path)
})

test("circuitJson boards reuse provided traces and offsets inside panel", async () => {
  const { circuit } = getTestFixture()

  let autoroutingStartCount = 0
  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  let packingStartCount = 0
  circuit.on("packing:start", () => {
    packingStartCount++
  })

  circuit.add(
    <panel>
      <board pcbX={-20} circuitJson={boardJson} />
      <board pcbX={20} circuitJson={boardJson} />
    </panel>,
  )

  await circuit.renderUntilSettled()

  const renderedCircuitJson = circuit.getCircuitJson()
  const boards = renderedCircuitJson.filter(isPcbBoard)
  const pcbTraces = renderedCircuitJson.filter(isPcbTrace)

  expect(boards.length).toBe(2)
  expect(pcbTraces.length).toBe(2)

  for (const trace of pcbTraces) {
    const routeStart = trace.route[0]
    const board = boards.reduce<{ board: PcbBoard; distance: number } | null>(
      (closest, candidate) => {
        const distance = Math.abs(routeStart.x - candidate.center.x)
        if (!closest) return { board: candidate, distance }
        return distance < closest.distance
          ? { board: candidate, distance }
          : closest
      },
      null,
    )?.board

    if (!board) {
      throw new Error("Expected each trace to have a matching board")
    }

    trace.route.forEach((point, idx) => {
      const expectedPoint = inputTrace.route[idx]
      expect(point.x - board.center.x).toBeCloseTo(expectedPoint.x)
      expect(point.y - board.center.y).toBeCloseTo(expectedPoint.y)
    })
  }

  expect(autoroutingStartCount).toBe(0)
  expect(packingStartCount).toBe(0)
  expect(renderedCircuitJson).toMatchPcbSnapshot(import.meta.path)
})
