// Verhindert zusätzliches Konsolenfenster auf Windows im Release-Modus
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    cad_hub_lib::run()
}
