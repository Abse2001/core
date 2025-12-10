import { expect, test } from "bun:test"
import boardJson from "tests/components/normal-components/assets/simple-circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const inputTrace = (boardJson as any[]).find((el) => el.type === "pcb_trace")

// When circuitJson is provided we should reuse the provided routing/placement and
// not invoke packing/autorouting. This also needs to hold when boards are placed
// inside a panel with offsets.
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
    <panel width="100mm" height="100mm">
      <board pcbX={-20} circuitJson={boardJson as any} />
      <board pcbX={20} circuitJson={boardJson as any} />
    </panel>,
  )

  await circuit.renderUntilSettled()

  const renderedCircuitJson = circuit.getCircuitJson()
  const boards = renderedCircuitJson.filter((el) => el.type === "pcb_board")
  const pcbTraces = renderedCircuitJson.filter((el) => el.type === "pcb_trace")

  expect(boards.length).toBe(2)
  expect(pcbTraces.length).toBe(2)

  for (const trace of pcbTraces) {
    const routeStart = trace.route[0]
    const board = boards.reduce(
      (closest, candidate) => {
        const distance = Math.abs(routeStart.x - candidate.center.x)
        if (!closest) return { board: candidate, distance }
        return distance < closest.distance
          ? { board: candidate, distance }
          : closest
      },
      null as null | { board: any; distance: number },
    )!.board

    trace.route.forEach((point: any, idx: number) => {
      const expectedPoint = inputTrace.route[idx]
      expect(point.x - board.center.x).toBeCloseTo(expectedPoint.x)
      expect(point.y - board.center.y).toBeCloseTo(expectedPoint.y)
    })
  }

  expect(autoroutingStartCount).toBe(0)
  expect(packingStartCount).toBe(0)
  expect(renderedCircuitJson).toMatchPcbSnapshot(import.meta.path)
})
