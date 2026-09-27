import json,subprocess,sys,re
from pathlib import Path
p=Path(sys.argv[1]);video=p/(sys.argv[2] if len(sys.argv)>2 else 'EdUHK-Campus-Updated-90s.mp4')
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(video)]));stream=next(s for s in probe['streams'] if s['codec_type']=='video')
assert stream['codec_name']=='h264' and stream['pix_fmt']=='yuv420p'
assert (stream['width'],stream['height'])==(1920,1080)
assert stream['avg_frame_rate']=='30/1' and int(stream['nb_read_frames'])==2700
assert abs(float(probe['format']['duration'])-90)<.04
audio=[s for s in probe['streams'] if s['codec_type']=='audio']
assert len(audio)==1 and audio[0]['codec_name']=='aac'
assert int(audio[0]['sample_rate'])==48000 and audio[0]['channels']==2
assert abs(float(audio[0]['duration'])-90)<.04
cmd=['ffmpeg','-hide_banner','-v','info','-xerror','-i',str(video),'-vf','blackdetect=d=0.04:pix_th=0.10:pic_th=0.98','-an','-f','null','-']
result=subprocess.run(cmd,capture_output=True,text=True);assert result.returncode==0,result.stderr[-1500:]
black=[{'start':float(a),'end':float(b),'duration':float(c)} for a,b,c in re.findall(r'black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)',result.stderr)]
assert all(b['start']>=89.4 for b in black),black
audio_check=subprocess.run(['ffmpeg','-hide_banner','-i',str(video),'-vn','-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
mean=float(re.search(r'mean_volume: ([\-\d.]+)',audio_check.stderr)[1])
peak=float(re.search(r'max_volume: ([\-\d.]+)',audio_check.stderr)[1])
assert -26<mean<-14 and peak<-.5,(mean,peak)
sequence=json.loads((p.parent/'sequence-check.json').read_text());assert not sequence['issues'];assert not json.loads((p/'collisions.json').read_text())
report={'status':'PASS','duration_seconds':90,'resolution':[1920,1080],'fps':30,'decoded_frames':2700,'codec':'H.264','pixel_format':'yuv420p','audio_tracks':sum(s['codec_type']=='audio' for s in probe['streams']),'shots':len(sequence['counts']),'timeline_counts':sequence['counts'],'black_intervals':black,'black_note':'Only the intentional ending fade may become black.','camera_and_featured_actor_paths':'PASS','rendering':'Same Three.js scene and camera data; native OpenGL preview lighting.'}
report['audio']={'codec':'AAC','sample_rate':48000,'channels':2,'mean_dbfs':mean,'peak_dbfs':peak,'title':'Carefree','artist':'Kevin MacLeod','fade_in_seconds':1.2,'fade_out_seconds':3.5}
(p/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
