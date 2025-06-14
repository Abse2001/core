import React from "react"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure a group schematic border is rendered as a schematic_box

test("group schematic border", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <group name="G1" schWidth={4} schHeight={3} border={{ dashed: true }}>
        <resistor name="R1" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  const boxes = circuit.db.schematic_box.list()
  expect(boxes.length).toBe(1)
  expect(boxes[0].width).toBe(4)
  expect(boxes[0].height).toBe(3)
  expect(boxes[0].is_dashed).toBe(true)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
