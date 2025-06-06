import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a jumper with pinrow4 footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="15mm">
      <jumper
        name="J1"
        footprint="solderjumper2"
        pinCount={2}
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      />
      <jumper
        name="J2"
        footprint="solderjumper2_bridged12"
        pinCount={2}
        internallyConnectedPins={[["1", "2"]]}
        pcbX={4}
        pcbY={4}
        schX={2}
        schY={2}
        layer={"bottom"}
        schRotation={90}
      />
      <jumper
        name="J3"
        footprint="solderjumper3_bridged23"
        pinCount={3}
        internallyConnectedPins={[["3", "2"]]}
        pcbX={-4}
        layer={"bottom"}
        pcbY={-4}
        schX={-2}
        schY={-2}
      />
      <jumper
        name="J4"
        footprint="solderjumper3_bridged123"
        pinCount={3}
        internallyConnectedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        pcbX={4}
        pcbY={-4}
        schX={2}
        schY={-2}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
