import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group renders schematic border", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group border={{ dashed: true }}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  const boxes = circuit.db.schematic_box.list()
  expect(boxes.length).toBe(1)
  expect(boxes[0].is_dashed).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
