import csv
import os
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

origins = [value.strip() for value in os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:5500,http://localhost:5500").split(",") if value.strip()]
CORS(app, resources={r"/api/*": {"origins": origins}})

CSV_PATH = Path(__file__).resolve().parent / "data" / "cirugia_estetica_dashboard.csv"
NUMERIC_COLUMNS = {
    "Year", "Record Count", "Surgeons Sum", "Average Price Sum", "Min Price Sum",
    "Max Price Sum", "Min Average Price", "Max Average Price", "Range Min", "Range Max",
}
REQUIRED_COLUMNS = {
    "Year", "Country", "City", "Procedure", "Record Count", "Surgeons Sum",
    "Average Price Sum", "Min Price Sum", "Max Price Sum", "Min Average Price",
    "Max Average Price", "Range Min", "Range Max",
}


def read_rows():
    if not CSV_PATH.is_file():
        raise FileNotFoundError(f"No se encontró el archivo de datos: {CSV_PATH.name}")
    with CSV_PATH.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        missing = REQUIRED_COLUMNS.difference(reader.fieldnames or [])
        if missing:
            raise ValueError("Faltan columnas requeridas: " + ", ".join(sorted(missing)))
        rows = []
        for line, row in enumerate(reader, start=2):
            result = dict(row)
            for column in NUMERIC_COLUMNS:
                try:
                    result[column] = float(row[column]) if "." in row[column] else int(row[column])
                except (TypeError, ValueError):
                    raise ValueError(f"Valor numérico inválido en la fila {line}: {column}") from None
            rows.append(result)
    return rows


@app.get("/")
def index():
    return jsonify(service="OCE API", status="ok", endpoints=["/api/health", "/api/procedimientos"])


@app.get("/api/health")
def health():
    return jsonify(status="ok", data_file=CSV_PATH.is_file())


@app.get("/api/procedimientos")
def procedimientos():
    try:
        return jsonify(read_rows())
    except FileNotFoundError as error:
        return jsonify(error=str(error)), 500
    except ValueError as error:
        app.logger.exception("El CSV de datos no es válido")
        return jsonify(error=str(error)), 500


if __name__ == "__main__":
    app.run()
