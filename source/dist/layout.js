// Hand-digitised in a 1888 × 1334 reference frame from the official A3 campus
// map, cross-checked against Google Maps satellite imagery on 2026-09-13.
// This frame preserves the map's rotation. North is approximately upper-right.
// A scale of 0.5 model metres per reference pixel is approximate, not surveyed.
export const MAP_SCALE=.5;
export const mapPoint=([u,v])=>[(u-950)*MAP_SCALE,(v-655)*MAP_SCALE];
export const mapPolygon=points=>points.map(mapPoint);
export const BOUNDARY_PX=[[236,724],[240,689],[258,660],[297,640],[333,640],[360,656],[414,633],[480,597],[549,556],[609,514],[657,475],[690,449],[724,434],[771,425],[810,431],[850,449],[909,487],[976,535],[1027,575],[1064,590],[1076,581],[1087,505],[1093,424],[1086,348],[1081,302],[1153,286],[1235,269],[1312,249],[1358,273],[1374,295],[1368,319],[1366,345],[1390,386],[1402,451],[1403,539],[1407,610],[1412,671],[1442,713],[1475,738],[1508,753],[1529,777],[1545,804],[1573,825],[1601,835],[1607,859],[1600,886],[1575,909],[1550,927],[1563,988],[1468,979],[1362,957],[1231,923],[1118,886],[1030,851],[922,806],[837,771],[808,773],[749,762],[648,831],[537,908],[520,947],[500,982],[466,1006],[426,1008],[381,993],[352,957],[332,911],[309,856],[275,797],[246,750]];
export const BOUNDARY=mapPolygon(BOUNDARY_PX);
// Gate piers traced at (308,830) and (322,860) in the official plan frame.
// +local Z points out towards the Lo Ping Road bus/taxi forecourt.
export const GATE={centre:[315,845],angle:-Math.atan2(30,14)};
export function gatePoint(x,z){const [cx,cz]=mapPoint(GATE.centre),a=GATE.angle;return[cx+x*Math.cos(a)+z*Math.sin(a),cz-x*Math.sin(a)+z*Math.cos(a)];}
export const GATE_APPROACH=[[-11,-10],[11,-10],[11,33],[-11,33]].map(p=>gatePoint(...p));
// Bus/taxi forecourt digitised from the same plan, outside the main gate.
export const BUS_BOUNDARY=mapPolygon([[278,851],[299,847],[309,865],[314,889],[310,906],[300,925],[265,979],[244,1014],[231,1027],[208,1014],[184,1001],[172,1002],[163,1011],[149,1003],[167,972],[190,931],[216,897],[243,875],[264,860]]);
export const BUS={centre:[244,945],vehicle:[247,947],angle:-Math.atan2(55,76)};
export function busPoint(x,z){const [cx,cz]=mapPoint(BUS.centre),a=BUS.angle;return[cx+x*Math.cos(a)+z*Math.sin(a),cz-x*Math.sin(a)+z*Math.cos(a)];}
// University name stone in the landscaped forecourt of the administrative block.
export const MONUMENT={centre:[428,933],angle:Math.PI-.38,base:6.20};
export function monumentPoint(x,h,z){const [cx,cz]=mapPoint(MONUMENT.centre),a=MONUMENT.angle;return[cx+x*Math.cos(a)+z*Math.sin(a),h,cz-x*Math.sin(a)+z*Math.cos(a)];}
export const ACADEMIC=[
 {code:'B1',p:[[440,807],[469,793],[516,888],[484,904]]},
 {code:'B2',p:[[510,768],[540,752],[588,850],[557,866]]},
 {code:'B3',p:[[579,729],[610,712],[660,810],[629,827]]},
 {code:'B4',p:[[646,689],[678,671],[729,770],[697,788]]},
 {code:'D1',p:[[891,662],[925,677],[880,771],[848,756]]},
 {code:'D2',p:[[965,694],[998,709],[952,805],[920,790]]},
 {code:'D3',p:[[1040,727],[1073,742],[1028,839],[995,824]]},
 {code:'D4',p:[[1115,760],[1147,774],[1105,869],[1071,854]]}
];
export const SPINES=[[[466,796],[480,822],[676,710],[662,684]],[[908,687],[897,714],[1124,812],[1137,785]]];
export const FORESTS=[
 [[671,493],[719,455],[769,445],[809,451],[888,496],[847,553],[832,576],[747,586],[721,570]],
 [[960,572],[991,583],[1060,622],[1093,610],[1098,663],[1233,668],[1268,680],[1268,751],[1252,765],[1153,743],[1054,701],[943,651]],
 [[1115,306],[1169,294],[1289,263],[1310,280],[1298,366],[1191,358],[1140,346]],
 [[1352,350],[1380,397],[1392,474],[1351,472],[1333,422]],
 [[1337,548],[1386,548],[1385,580],[1326,580]],
 [[1496,778],[1522,800],[1534,829],[1579,843],[1595,862],[1574,894],[1542,905],[1512,869]]
];
export const PATHS=[
 {kind:'road',w:8.2,p:[[256,872],[315,845],[350,830],[440,788],[550,729],[651,671],[710,622],[771,602],[825,613],[923,656],[1038,708],[1147,754],[1246,782],[1271,771],[1313,758],[1434,767],[1494,778],[1531,812]]},
 {kind:'road',w:6,p:[[337,836],[304,795],[257,726],[270,681],[317,652],[361,667],[450,620],[551,559],[658,478],[727,438],[784,437],[844,458],[932,518],[1016,577],[1065,603],[1087,588],[1104,486],[1102,395],[1091,308]]},
 {kind:'road',w:6,p:[[1271,771],[1302,724],[1308,641],[1312,552],[1319,466],[1325,361],[1316,284]]},
 {kind:'walk',w:5,p:[[365,889],[403,919],[447,942],[487,907],[532,879],[631,823],[749,752],[782,754],[814,750],[910,790],[1023,839],[1135,888],[1245,926],[1382,963],[1529,979]]},
 {kind:'walk',w:3,p:[[722,609],[741,585],[761,571],[802,562],[843,551],[864,525],[879,505]]},
 {kind:'walk',w:3,p:[[927,652],[963,649],[1018,668],[1077,689],[1130,683],[1199,677],[1281,695]]},
 {kind:'walk',w:3,p:[[339,832],[358,855],[364,886]]},
 {kind:'walk',w:3,p:[[1301,746],[1369,743],[1408,747],[1444,757],[1478,774],[1497,814],[1519,893]]}
];
export const SOURCES={
 official:'https://www.eduhk.hk/re/student_handbook/tc/Maps-Of-The-University-Campuses.html',
 plan:'https://www.apply.eduhk.hk/ug/sites/default/files/2026-02/Campus%20map.jpg',
 currentPlan:'https://iday.eduhk.hk/sites/default/files/2026-05/Faculty%20info%20day%20agenda_digital%20(FINAL).pdf',
 satellite:'https://www.google.com/maps/place/%E9%A6%99%E6%B8%AF%E6%95%99%E8%82%B2%E5%A4%A7%E5%AD%A6/@22.4685355,114.1949744,516m/data=!3m1!1e3!4m6!3m5!1s0x340409071d2e8877:0x9062d0835c0a2b87!8m2!3d22.4670285!4d114.1936333!16zL20vMDNtdl9s?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D',
 newBuilding:'https://www.eduhk.hk/eo/our-projects/new-academic-building-tai-po-campus'
};
