# Genera un archivo DOCX a partir de un Markdown simple.
# Uso: python md_a_docx.py entrada.md salida.docx
# Soporta: títulos (#, ##, ###, ####), párrafos, listas con -, listas numeradas,
# bloques de código (```), citas (>), tablas (|), negritas **, código inline ` y reglas ---.

import sys
import re

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def shade(paragraph, fill):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    pPr.append(shd)


def add_inline(paragraph, text, base_size=11):
    """Agrega texto con soporte de `codigo` y **negritas**."""
    tokens = re.split(r"(\*\*.+?\*\*|`[^`]+`)", text)
    for token in tokens:
        if not token:
            continue
        if token.startswith("**") and token.endswith("**"):
            run = paragraph.add_run(token[2:-2])
            run.bold = True
        elif token.startswith("`") and token.endswith("`"):
            run = paragraph.add_run(token[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(base_size - 1)
            run.font.color.rgb = RGBColor(0xB0, 0x30, 0x60)
        else:
            run = paragraph.add_run(token)
        run.font.size = Pt(base_size) if not (
            token.startswith("`") and token.endswith("`")
        ) else Pt(base_size - 1)


def add_table(doc, lines):
    rows = [[c.strip() for c in line.strip().strip("|").split("|")] for line in lines]
    if len(rows) > 1 and all(re.fullmatch(r":?-{3,}:?", c) for c in rows[1]):
        rows.pop(1)
    if not rows:
        return
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = "Table Grid"
    for i, row in enumerate(rows):
        for j, cell in enumerate(row):
            if j >= len(table.rows[i].cells):
                continue
            paragraph = table.rows[i].cells[j].paragraphs[0]
            add_inline(paragraph, cell, base_size=10)
            if i == 0:
                for run in paragraph.runs:
                    run.bold = True
    doc.add_paragraph()


def convertir(entrada, salida):
    with open(entrada, encoding="utf-8") as f:
        lineas = f.read().splitlines()

    doc = Document()

    estilo = doc.styles["Normal"]
    estilo.font.name = "Calibri"
    estilo.font.size = Pt(11)

    i = 0
    mientras_codigo = False
    codigo = []
    tabla = []

    def volcar_tabla():
        nonlocal tabla
        if tabla:
            add_table(doc, tabla)
            tabla = []

    while i < len(lineas):
        linea = lineas[i]

        # --- bloques de codigo ---
        if linea.strip().startswith("```"):
            if mientras_codigo:
                p = doc.add_paragraph()
                shade(p, "F4F4F4")
                run = p.add_run("\n".join(codigo))
                run.font.name = "Consolas"
                run.font.size = Pt(9)
                run._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas")
                codigo, mientras_codigo = [], False
            else:
                volcar_tabla()
                mientras_codigo = True
            i += 1
            continue

        if mientras_codigo:
            codigo.append(linea)
            i += 1
            continue

        # --- tablas ---
        if linea.strip().startswith("|"):
            tabla.append(linea.strip())
            i += 1
            continue
        volcar_tabla()

        if not linea.strip():
            i += 1
            continue

        # --- reglas horizontales ---
        if re.fullmatch(r"-{3,}", linea.strip()):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            run = p.add_run("_" * 78)
            run.font.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)
            i += 1
            continue

        # --- citas ---
        if linea.strip().startswith(">"):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            add_inline(p, linea.strip().lstrip(">").strip())
            for run in p.runs:
                run.italic = True
            i += 1
            continue

        # --- titulos ---
        m = re.match(r"^(#{1,4})\s+(.*)$", linea)
        if m:
            nivel = len(m.group(1))
            p = doc.add_heading(level=min(nivel, 4))
            add_inline(p, m.group(2), base_size=[0, 18, 15, 13, 12][nivel])
            i += 1
            continue

        # --- listas ---
        m = re.match(r"^(\s*)[-*]\s+(.*)$", linea)
        if m:
            p = doc.add_paragraph(style="List Bullet")
            p.paragraph_format.left_indent = Inches(0.25 + 0.2 * (len(m.group(1)) // 2))
            add_inline(p, m.group(2))
            i += 1
            continue

        m = re.match(r"^(\s*)(\d+)\.\s+(.*)$", linea)
        if m:
            p = doc.add_paragraph(style="List Number")
            add_inline(p, m.group(3))
            i += 1
            continue

        # --- parrafo normal ---
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        add_inline(p, linea.strip())
        i += 1

    volcar_tabla()

    # Pie: ruta de la fuente
    p = doc.add_paragraph()
    run = p.add_run(f"Generado desde {entrada}")
    run.italic = True
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(0x88, 0x88, 0x88)

    doc.save(salida)
    print(f"OK -> {salida}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python md_a_docx.py entrada.md salida.docx")
        sys.exit(1)
    convertir(sys.argv[1], sys.argv[2])
