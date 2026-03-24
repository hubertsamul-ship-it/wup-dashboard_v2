"""
watch_data.py — automatyczna regeneracja dashboard_final.json
=============================================================
Monitoruje folder dane/ (DBF, XLSX). Gdy pojawi się nowy plik
lub zostanie zmodyfikowany istniejący, uruchamia extract_data.py.

Uruchomienie:
    python watch_data.py

Zatrzymanie: Ctrl+C
"""

import os
import sys
import time
import subprocess
from datetime import datetime

# ── Konfiguracja ────────────────────────────────────────────────────────────

BASE       = os.path.dirname(__file__)                    # aplikacja/
DANE_DIR   = os.path.join(BASE, 'dane')                   # aplikacja/dane/
EXTRACT    = os.path.join(BASE, 'wup-dashboard', 'extract_data.py')
JSON_OUT   = os.path.join(BASE, 'wup-dashboard', 'public', 'data', 'dashboard_final.json')

POLL_SECS  = 15          # co ile sekund sprawdzać
EXTENSIONS = {'.xlsx', '.xls', '.dbf'}   # typy plików do śledzenia

# ── Pomocnicze ──────────────────────────────────────────────────────────────

def ts():
    return datetime.now().strftime('%H:%M:%S')

def newest_mtime(directory, extensions):
    """Zwraca najnowszy mtime wśród plików danych w katalogu."""
    latest = 0.0
    for root, _, files in os.walk(directory):
        for f in files:
            if os.path.splitext(f)[1].lower() in extensions:
                try:
                    m = os.path.getmtime(os.path.join(root, f))
                    if m > latest:
                        latest = m
                except OSError:
                    pass
    return latest

def json_mtime():
    """Zwraca mtime wygenerowanego JSONa (0 jeśli nie istnieje)."""
    try:
        return os.path.getmtime(JSON_OUT)
    except OSError:
        return 0.0

def run_extract():
    print(f'[{ts()}] ▶ Uruchamiam extract_data.py...')
    result = subprocess.run(
        [sys.executable, EXTRACT],
        cwd=os.path.join(BASE, 'wup-dashboard'),
        capture_output=False,
    )
    if result.returncode == 0:
        print(f'[{ts()}] ✔ dashboard_final.json zaktualizowany.')
    else:
        print(f'[{ts()}] ✘ extract_data.py zakończył się błędem (kod {result.returncode}).')

# ── Główna pętla ─────────────────────────────────────────────────────────────

def main():
    print('=' * 60)
    print('  WUP Dashboard — auto-watcher danych')
    print(f'  Obserwowany folder : {os.path.relpath(DANE_DIR, BASE)}')
    print(f'  Typy plików        : {", ".join(EXTENSIONS)}')
    print(f'  Interwał           : {POLL_SECS} s')
    print('  Zatrzymanie        : Ctrl+C')
    print('=' * 60)

    if not os.path.isdir(DANE_DIR):
        print(f'BŁĄD: folder dane/ nie istnieje: {DANE_DIR}')
        sys.exit(1)
    if not os.path.isfile(EXTRACT):
        print(f'BŁĄD: nie znaleziono extract_data.py: {EXTRACT}')
        sys.exit(1)

    # Przy starcie — jeśli JSON starszy niż dane, od razu odpal
    data_mt = newest_mtime(DANE_DIR, EXTENSIONS)
    json_mt = json_mtime()
    if data_mt > json_mt:
        print(f'[{ts()}] Dane nowsze niż JSON — regeneruję przy starcie...')
        run_extract()
    else:
        print(f'[{ts()}] JSON jest aktualny. Czekam na nowe pliki...')

    last_data_mt = newest_mtime(DANE_DIR, EXTENSIONS)

    try:
        while True:
            time.sleep(POLL_SECS)
            current = newest_mtime(DANE_DIR, EXTENSIONS)
            if current > last_data_mt:
                print(f'[{ts()}] Wykryto nowy/zmieniony plik danych.')
                time.sleep(3)          # poczekaj chwilę aż plik skończy się zapisywać
                run_extract()
                last_data_mt = newest_mtime(DANE_DIR, EXTENSIONS)
    except KeyboardInterrupt:
        print(f'\n[{ts()}] Watcher zatrzymany.')


if __name__ == '__main__':
    main()
