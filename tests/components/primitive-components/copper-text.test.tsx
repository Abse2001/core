import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CopperText rendering", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <coppertext
        text="Copper Layer Text"
        pcbX={1.2}
        pcbY={3.4}
        fontSize={0.25}
        layer="top"
        anchorAlignment="center"
      />
    </board>,
  )

  project.render()

  const copperTexts = project.db.pcb_copper_text.list()

  expect(copperTexts.length).toBe(1)
  expect(copperTexts[0].text).toBe("Copper Layer Text")
  expect(copperTexts[0].anchor_position.x).toBeCloseTo(1.2)
  expect(copperTexts[0].anchor_position.y).toBeCloseTo(3.4)
  expect(copperTexts[0].font_size).toBeCloseTo(0.25)
  expect(copperTexts[0].anchor_alignment).toBe("center")
  expect(copperTexts[0].is_knockout).toBe(false)
  expect(copperTexts[0].is_mirrored).toBe(false)
  expect(copperTexts[0].knockout_padding?.left).toBeCloseTo(0.2)

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
