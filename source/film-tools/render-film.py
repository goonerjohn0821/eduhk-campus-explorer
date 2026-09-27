import os,sys,json,time,subprocess,argparse
os.environ['LIBGL_ALWAYS_SOFTWARE']='1'
import moderngl as gl,numpy as np
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
parser=argparse.ArgumentParser();parser.add_argument('directory');parser.add_argument('--full',action='store_true');parser.add_argument('--start',type=int,default=0);parser.add_argument('--end',type=int);parser.add_argument('--output',default='EdUHK-Campus-Updated-90s.mp4');args=parser.parse_args()
p=Path(args.directory);full=args.full;W,H=(1920,1080) if full else (1280,720)
c=gl.create_standalone_context(backend='egl');print(c.info['GL_RENDERER'],flush=True)
vert='''#version 330
in vec3 p;in vec3 n;in vec3 color;uniform mat4 vp;uniform mat4 lightVP;out vec3 norm;out vec3 col;out vec4 shadowPos;out vec3 world;void main(){norm=n;col=color;world=p;shadowPos=lightVP*vec4(p,1);gl_Position=vp*vec4(p,1);}'''
frag='''#version 330
in vec3 norm;in vec3 col;in vec4 shadowPos;in vec3 world;uniform sampler2D shadowMap;uniform vec3 eye;uniform vec3 actorPos;uniform bool actorVisible;out vec4 f;
void main(){vec3 n=normalize(norm);if(!gl_FrontFacing)n=-n;vec3 lightDir=normalize(vec3(-280,450,240));vec3 s=shadowPos.xyz/shadowPos.w*.5+.5;float shade=0.;float bias=max(.00025*(1.-dot(n,lightDir)),.00009);for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)shade+=(s.z-bias<=texture(shadowMap,s.xy+vec2(x,y)/4096.).r)?1.:.28;shade/=9.;if(s.x<0.||s.x>1.||s.y<0.||s.y>1.)shade=1.;float hemi=.63+.23*n.y;vec3 lit=vec3(hemi)+vec3(1.05,1.,.84)*max(dot(n,lightDir),0.)*shade+vec3(.09,.13,.12)*max(dot(n,normalize(vec3(200,150,-250))),0.);vec3 rgb=col*lit*1.1;
 if(actorVisible&&abs(world.y-actorPos.y)<.09){float r=length((world.xz-actorPos.xz)/vec2(.38,.3));rgb*=1.-.20*exp(-r*r*1.6);}
 float fog=smoothstep(1250.,2200.,length(world-eye));rgb=mix(rgb,vec3(.68,.76,.70),fog);rgb=clamp((rgb*(2.51*rgb+.03))/(rgb*(2.43*rgb+.59)+.14),0.,1.);f=vec4(pow(rgb,vec3(1./2.2)),1.);}'''
program=c.program(vertex_shader=vert,fragment_shader=frag)
shadowProg=c.program(vertex_shader='''#version 330
in vec3 p;uniform mat4 vp;void main(){gl_Position=vp*vec4(p,1);}''',fragment_shader='''#version 330
void main(){}''')
vertexBytes=(p/'static.v').read_bytes();indexBytes=(p/'static.i').read_bytes();assert len(vertexBytes)%36==0;assert int(np.frombuffer(indexBytes,np.uint32).max())<len(vertexBytes)//36
v=c.buffer(vertexBytes);idx=c.buffer(indexBytes);vao=c.vertex_array(program,[(v,'3f 3f 3f','p','n','color')],idx);shadowVao=c.vertex_array(shadowProg,[(v,'3f 24x','p')],idx)
def look(eye,target):
 eye=np.array(eye,float);z=eye-np.array(target);z/=np.linalg.norm(z);x=np.cross([0,1,0],z);x/=np.linalg.norm(x);y=np.cross(z,x);m=np.eye(4);m[:3,:3]=[x,y,z];m[:3,3]=-m[:3,:3]@eye;return m
proj=np.array([[1/520,0,0,0],[0,1/430,0,0],[0,0,-2/1300,-1],[0,0,0,1]],float);lv=proj@look([-430,690,365],[0,0,0]);light=lv.T.astype('f4').tobytes();shadowProg['vp'].write(light);program['lightVP'].write(light)
depth=c.depth_texture((4096,4096));depth.compare_func='';depth.repeat_x=False;depth.repeat_y=False;shadowFbo=c.framebuffer(depth_attachment=depth);shadowFbo.use();shadowFbo.clear(depth=1);c.enable(gl.DEPTH_TEST);shadowVao.render();depth.use(0);program['shadowMap']=0
fb=c.simple_framebuffer((W,H));dynamicV=c.buffer(reserve=1000000);dynamicI=c.buffer(reserve=300000);dynamicVao=c.vertex_array(program,[(dynamicV,'3f 3f 3f','p','n','color')],dynamicI)
frames=json.loads((p/'frames.json').read_text());data=open(p/'actors.bin','rb');video=None
if full:video=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(p/(args.output+'.partial.mp4'))],stdin=subprocess.PIPE)
fontPath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(fontPath,int(W*.023));small=ImageFont.truetype(fontPath,int(W*.012));chinese=ImageFont.truetype(str(Path(__file__).parent/'fonts/NotoSansCJK-labels.otf'),int(W*.028));captionEnglish=ImageFont.truetype(fontPath,int(W*.012));creditFont=ImageFont.truetype(fontPath,int(W*.009));licenseFont=ImageFont.truetype(fontPath,int(W*.0075));freeze=None;start=time.time()
for i,f in enumerate(frames):
 if i<args.start or (args.end is not None and i>=args.end):continue
 fb.use();fb.clear(.84,.89,.85,1);program['vp'].write(np.array(f['vp'],np.float32).tobytes());program['eye'].value=f['position'];program['actorVisible'].value=bool(f['actor']);program['actorPos'].value=f.get('actorPosition') or [0,-99,0];vao.render()
 if f['actor']:
  a=f['actor'];data.seek(a['offset']);vb=data.read(a['vbytes']);ib=data.read(a['ibytes']);assert len(vb)==a['vbytes'] and len(ib)==a['ibytes'],f['time'];dynamicV.write(vb);dynamicI.write(ib);dynamicVao.render(vertices=a['ibytes']//4)
 im=Image.frombytes('RGB',(W,H),fb.read(components=3)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 if f.get('caption') and f.get('captionOpacity',0)>0:
  overlay=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(overlay);alpha=f['captionOpacity'];x=int(W*.052);y=int(H*.785);cn,en=f['caption'];boxW=max(d.textlength(cn,font=chinese),d.textlength(en,font=captionEnglish))+W*.04
  d.rounded_rectangle((x-W*.016,y-H*.013,x+boxW,y+H*.116),radius=int(W*.006),fill=(20,46,35,int(220*alpha)))
  d.rectangle((x-W*.016,y-H*.013,x-W*.012,y+H*.116),fill=(229,201,136,int(255*alpha)))
  d.text((x,y),cn,font=chinese,fill=(255,255,243,int(255*alpha)),anchor='lt');d.text((x,y+H*.069),en,font=captionEnglish,fill=(210,226,211,int(255*alpha)),anchor='lt');im=Image.alpha_composite(im.convert('RGBA'),overlay).convert('RGB')
 if f['photo']:
  if freeze is None:freeze=im.copy()
  im=freeze.copy();u=f['photoProgress'];w=int(W*(1-.10*u));h=int(H*(1-.20*u));canvas=Image.new('RGB',(W,H),'#e9eee5');x=(W-w)//2;y=int(H*.03*u);canvas.paste(im.resize((w,h),Image.Resampling.LANCZOS),(x,y));d=ImageDraw.Draw(canvas);d.rectangle([x,y,x+w-1,y+h-1],outline='white',width=max(1,int(W*.005*u)));ty=y+h+H*.035;d.text((W/2,ty),'The Education University of Hong Kong',font=font,fill='#234437',anchor='mt');d.text((W/2,ty+H*.05),'AI-assisted Web3D & New Media Experiment',font=small,fill='#52645c',anchor='mt');d.text((W/2,H*.955),'Music: Carefree · Kevin MacLeod (incompetech.com) · CC BY 4.0 · edited excerpt',font=creditFont,fill='#52645c',anchor='mt');d.text((W/2,H*.978),'creativecommons.org/licenses/by/4.0/',font=licenseFont,fill='#52645c',anchor='mt');im=canvas
 if f['flash']>0:im=Image.blend(im,Image.new('RGB',(W,H),'white'),min(.78,f['flash']*.78))
 if f['fade']>0:im=Image.blend(im,Image.new('RGB',(W,H),'black'),f['fade'])
 if full:
  video.stdin.write(im.tobytes())
  if i%90==0 or i in [449,479,509,539,2599,2601,2631,2670]:im.save(p/f'check-{i:04d}.jpg',quality=90)
 else:im.save(p/f"{i:02d}_{f['time']:05.2f}.jpg",quality=91)
 if i%90==0:print(f"render {args.output} {i}/{len(frames)} elapsed {time.time()-start:.1f}s",flush=True)
if video:video.stdin.close();status=video.wait();assert status==0;os.replace(p/(args.output+'.partial.mp4'),p/args.output)
print('complete',time.time()-start,flush=True)
