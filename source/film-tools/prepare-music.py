"""Make the shared 90-second film score from Kevin MacLeod's Carefree."""
import json, re, subprocess, sys
from pathlib import Path

source, output = Path(sys.argv[1]), Path(sys.argv[2])
output.parent.mkdir(parents=True, exist_ok=True)
base = 'atrim=0:90,asetpts=PTS-STARTPTS,highpass=f=40'
analysis = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(source), '-af',
    base + ',loudnorm=I=-19:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'],
    capture_output=True, text=True, check=True)
stats = json.loads(re.findall(r'\{\s*"input_i".*?\}', analysis.stderr, re.S)[-1])
normal = (f'loudnorm=I=-19:TP=-1.5:LRA=9:measured_I={stats["input_i"]}'
    f':measured_TP={stats["input_tp"]}:measured_LRA={stats["input_lra"]}'
    f':measured_thresh={stats["input_thresh"]}:offset={stats["target_offset"]}:linear=true')
filters = base + ',' + normal + ',afade=t=in:st=0:d=1.2,afade=t=out:st=86.5:d=3.5'
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
    '-af', filters, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(output)], check=True)
(output.parent/'music-mastering.json').write_text(json.dumps({'source':str(source),
    'title':'Carefree', 'artist':'Kevin MacLeod', 'bpm':96, 'input':stats,
    'processing':filters, 'duration':90, 'license':'https://creativecommons.org/licenses/by/4.0/'}, indent=2))
print(json.dumps({'score':str(output), 'duration':90, 'fade_in':1.2, 'fade_out':3.5}))
