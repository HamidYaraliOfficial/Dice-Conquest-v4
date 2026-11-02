import {describe,it,expect} from "vitest";
import {Engine,MAXS,COLORS} from "../src/engine.js";
const mk=(owners,ns,edges)=>{const T=owners.map((o,i)=>({id:i,name:"T"+i,x:0,y:0,S:34,owner:o,n:ns[i],nb:[]}));edges.forEach(([a,b])=>{T[a].nb.push(b);T[b].nb.push(a)});
 return{T,P:Array.from({length:Math.max(...owners)+1},(_,i)=>({id:i,alive:true,atk:0,w:0,l:0})),turn:0,round:1,hist:[],over:false,winner:-1}};
const fix=v=>{let i=0;Engine.setRandom(()=>(v[i++%v.length]-.5)/6)};
describe("dice",()=>{
 it("rolls exactly n dice in 1..6",()=>{Engine.setRandom(Math.random);for(const n of[1,3,5,8]){const d=Engine.roll(n);expect(d).toHaveLength(n);d.forEach(x=>{expect(x).toBeGreaterThanOrEqual(1);expect(x).toBeLessThanOrEqual(6)})}});
 it("sums",()=>expect(Engine.sum([6,2,5,3,4,1])).toBe(21));
 it("battle uses 5 attacker and 3 defender dice",()=>{Engine.setRandom(Math.random);const G=mk([0,1],[5,3],[[0,1]]),r=Engine.resolve(G,0,1);expect(r.ad).toHaveLength(5);expect(r.dd).toHaveLength(3);expect(r.as).toBe(Engine.sum(r.ad))})});
describe("battle",()=>{
 it("attacker wins with higher total; 5 soldiers move",()=>{const G=mk([0,1],[6,4],[[0,1]]);fix([6,2,5,3,4,1,3,6,2,4]);const r=Engine.resolve(G,0,1);expect([r.as,r.ds,r.win]).toEqual([21,15,true]);Engine.apply(G,r);expect(G.T[1].owner).toBe(0);expect(G.T[1].n).toBe(5);expect(G.T[0].n).toBe(1)});
 it("defender wins when higher",()=>{const G=mk([0,1],[3,3],[[0,1]]);fix([1,1,1,6,6,6]);Engine.apply(G,Engine.resolve(G,0,1));expect(G.T[1].owner).toBe(1);expect(G.T[1].n).toBe(3);expect(G.T[0].n).toBe(1)});
 it("tie goes to defender",()=>{const G=mk([0,1],[2,2],[[0,1]]);fix([3,3,3,3]);const r=Engine.resolve(G,0,1);expect(r.win).toBe(false);Engine.apply(G,r);expect(G.T[1].owner).toBe(1);expect(G.T[0].n).toBe(1)});
 it("non-adjacent and 1-soldier attacks are illegal",()=>{const G=mk([0,1,1],[4,2,2],[[0,1],[1,2]]);expect(Engine.canAttack(G,0,2)).toBe(false);expect(()=>Engine.resolve(G,0,2)).toThrow();expect(Engine.canAttack(mk([0,1],[1,2],[[0,1]]),0,1)).toBe(false)})});
describe("reinforcement & end",()=>{
 it("uses largest connected group",()=>{const G=mk([0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1],[[0,1],[1,2],[2,3],[3,4],[4,7],[7,5],[7,6]]);expect(Engine.largest(G,0)).toBe(5)});
 it("respects cap of 8",()=>{Engine.setRandom(Math.random);const G=mk([0,0,1],[7,8,1],[[0,1],[1,2]]);Engine.reinforce(G,0);expect(G.T[0].n).toBe(8);expect(G.T[1].n).toBe(8);expect(Engine.reinforce(mk([0,0,1],[8,8,1],[[0,1],[1,2]]),0)).toBe(0);expect(MAXS).toBe(8)});
 it("eliminates a player and ends the game",()=>{const G=mk([0,1],[3,2],[[0,1]]);fix([6,6,6,1,1]);Engine.apply(G,Engine.resolve(G,0,1));expect(G.P[1].alive).toBe(false);expect(G.over).toBe(true);expect(G.winner).toBe(0)})});
describe("map",()=>{
 it("is seeded, symmetric and connected",()=>{const a=Engine.genMap(),b=Engine.genMap();expect(a.map(x=>x.name)).toEqual(b.map(x=>x.name));
  a.forEach(x=>x.nb.forEach(n=>expect(a[n].nb).toContain(x.id)));const seen=new Set([0]),st=[0];while(st.length)for(const n of a[st.pop()].nb)if(!seen.has(n)){seen.add(n);st.push(n)}expect(seen.size).toBe(a.length)})});
describe("world & placement",()=>{
 it("pool is half the frontier (rounded up, min 1) and placement is free",()=>{const G=mk([0,1,1],[3,2,2],[[0,1],[0,2]]);expect(Engine.frontier(G,0)).toBe(2);expect(Engine.poolFor(G,0)).toBe(1);const H=mk([0,1,1,1,1],[3,2,2,2,2],[[0,1],[0,2],[0,3],[0,4]]);expect(Engine.poolFor(H,0)).toBe(2);Engine.place(H,0,0);expect(H.T[0].n).toBe(4)});
 it("rejects illegal placement and caps pool by capacity",()=>{const G=mk([0,1],[8,2],[[0,1]]);expect(()=>Engine.place(G,0,0)).toThrow();expect(()=>Engine.place(G,0,1)).toThrow();expect(Engine.poolFor(G,0)).toBe(0)});
 it("has 50 territories and sea bridges",()=>{const T=Engine.genMap();expect(T).toHaveLength(50);expect(T.every(x=>x.nb.length>0)).toBe(true)});
 it("newGame is reproducible from seed",()=>{const a=Engine.newGame({players:4,humans:1,diff:2,seed:"s1"}),b=Engine.newGame({players:4,humans:1,diff:2,seed:"s1"});expect(a.T.map(x=>x.owner)).toEqual(b.T.map(x=>x.owner))})});
describe("continents",()=>{
 it("gives a bonus for owning a whole continent",()=>{const T=Engine.genMap();expect(T.every(x=>x.cont>=0)).toBe(true);const G={T,P:[{},{}]};T.forEach(x=>x.owner=x.cont===5?0:1);expect(Engine.bonus(G,0)).toBe(2);expect(Engine.bonus(G,1)).toBe(17);T.forEach(x=>x.owner=0);expect(Engine.bonus(G,0)).toBe(19)})});
describe("alliances",()=>{
 const tm=(G,t)=>{G.P.forEach((p,i)=>p.team=t[i]);return G};
 it("allies cannot attack and are not targets or frontier",()=>{const G=tm(mk([0,1,2],[4,2,2],[[0,1],[0,2]]),[0,0,1]);expect(Engine.canAttack(G,0,1)).toBe(false);expect(Engine.targets(G,0)).toEqual([2]);expect(Engine.frontier(G,0)).toBe(1)});
 it("ally merges teams and break splits",()=>{const G=tm(mk([0,1,2],[2,2,2],[[0,1],[1,2]]),[0,1,2]);Engine.ally(G,0,1);expect(Engine.allied(G,0,1)).toBe(true);Engine.breakAlly(G,0);expect(Engine.allied(G,0,1)).toBe(false);expect(Engine.allied(G,0,2)).toBe(false)});
 it("team wins together when only allies remain",()=>{const G=tm(mk([0,1,2],[3,2,2],[[0,2],[0,1]]),[0,0,1]);fix([6,6,6,1,1]);Engine.apply(G,Engine.resolve(G,0,2));expect(G.over).toBe(true);expect(G.winner).toBe(0)})});
describe("roster",()=>{it("uses custom names and colors with defaults as fallback",()=>{const g=Engine.newGame({players:3,humans:1,diff:2,seed:"r",roster:[{name:"Ana",color:"#112233"},{},{name:"Bo"}]});expect(g.P[0].name).toBe("Ana");expect(g.P[0].color).toBe("#112233");expect(g.P[1].name).toMatch(/2/);expect(g.P[2].name).toBe("Bo");expect(g.P[2].color).toBe(COLORS[2])})});
