# How to run vm?

```bash
dbus-run-session gnome-shell --nested --wayland
```

# Build whisper cpp

```bash
mkdir whisper-cpp
cd whisper-cpp
git clone https://github.com/ggerganov/whisper.cpp.git ./
```

- Build executable

```bash
cd whisper-cpp/
cmake -B build
cmake --build build --config Release -j
```

- Download model

```bash
bash models/download-ggml-model.sh base
```

- Copy files to correct paths.

```bash
cd ..
mkdir bin/
cp whisper-cpp/build/bin/whisper-cli
cp whisper-cpp/models/ggml-base.bin bin/ggml-base.bin
```
