use std::{env, fs, process};
fn main(){
 let Some(path)=env::args().nth(1) else { eprintln!("usage: luaforge-inspect <file.lua>"); process::exit(2); };
 if !path.ends_with(".lua"){eprintln!("expected a .lua file");process::exit(2)}
 match fs::read_to_string(&path){Ok(text)=>{println!("file: {path}\nlines: {}\nbytes: {}\nnote: text inspection only; no Lua execution",text.lines().count(),text.len());},Err(e)=>{eprintln!("{e}");process::exit(1)}}
}
