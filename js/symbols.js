import {Instruct} from "./svg_handler.js";

class Symbol {
    constructor(offset) {
      this.offset = offset;
      this.instructs = [];
    }
    create() {
      return this.instructs;
    }
  }


class RelativeLocation extends Symbol{
    constructor(offset, dispersionType) {
        super(offset);
        this.width = 680, this.height = 480;
        this.color = 'gray'; 
        this.instructs.push(new Instruct(this.offset, {
            'type': 'rect',
            'x': 10,
            'y': 10,
            'width': this.width,
            'height': this.height,
            'fill': 'none',
            'stroke': this.color,
            'stroke-width': '7'
        }));
        if(dispersionType == 'connected') {
            this.addSingleBolt(Math.round(this.width/2,0));
        } else if(dispersionType == 'disconnected') {
            this.addDoubleBolt( Math.round(this.width/2,0));
        }
    }
    drawWhiteGap(x, y, width) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'rect', 'x': x, 'y': y, 'width': width, 'height': 9, 'fill':'white'
        }));
    }
    addSingleBolt(mid_x) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': mid_x,
            'y': 10,
            'd': 'l 0 0 -30 100 30 0 -30 100 30 0 -30 100 30 0 -30 100 30 0 -30 80',
            'stroke': this.color,
            'stroke-width': 5,
            'fill': 'transparent'
        }));
    }
    addDoubleBolt(mid_x) {
        const w = 14
        this.drawWhiteGap(Math.round(mid_x - 0.5*w, 0), 5, w);
        this.drawWhiteGap(Math.round(mid_x - 2.5*w, 0), 486, w);
        this.addSingleBolt(Math.round(mid_x - 0.5*w, 0));
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': Math.round(mid_x + 0.5*w, 0),
            'y': 10,
            'd': 'l 0 0 -24 80 30 0 -30 100 30 0 -30 100 30 0 -30 100 30 0 -36 100',
            'stroke': this.color,
            'stroke-width': 5,
            'fill': 'transparent'
        }));
       
}
}   

class SubtaskAttribute extends Symbol {
    // TODO not yet implementd and not accessible from form
    constructor(offset, leftPhyWork, rightPhyWork, subtasks, color) {
        super(offset);
        this.x = -50;
        this.y = 25;
        this.width = 100;
        this.height = 50;
        
        let connectorCount = 0;
       // calculate distance, sign
        if(leftPhyWork.jointWorkExists && subtasks.joint) {
            this.addConnector(0, this.y+this.height/2, 0);
            connectorCount++;
        }
        if(leftPhyWork.indivCount > 0 && subtasks.left) {
            const x_left = this.calculateOffset(leftPhyWork.offset.x - this.offset.x, leftPhyWork.indivSlots, leftPhyWork.lastIndivIdx, false)
            this.addConnector(this.x, this.y + this.height/2, x_left);
            connectorCount++;
        }
        if(rightPhyWork.indivCount > 0 && subtasks.right) {
            const x_right = this.calculateOffset(rightPhyWork.offset.x  - (this.offset.x + this.x + this.width), rightPhyWork.indivSlots, rightPhyWork.lastIndivIdx, true)
            this.addConnector(this.x + this.width, this.y + this.height/2, x_right);
            connectorCount++;
        
        }
        if(connectorCount > 0) {
            this.addBlock(color);
        }
    }
    calculateOffset(x, slots, idx, isRight) {
        let i = (isRight) ? idx - 1 : 0;
        if(isRight){x += slots[i].x;}
        return x +  idx*slots[i].width/2;
           
    }
      
    addBlock(color) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'rect',
            'x': this.x,
            'y': this.y,
            'width': this.width,
            'height': this.height,
            'fill': color,
            'stroke': 'black',
            'stroke-width': 5
        }))
    }
    addConnector(x,y, distance) {
        // <path d="M 300 50 l -50 0 0 50" stroke="black" stroke-width="5" fill="transparent"/>
        // <path d="M 400 50 l 50 0 0 50" stroke="black" stroke-width="5" fill="transparent"/>
        this.instructs.push(new Instruct(this.offset, {
            'type': 'polyline',
            'x': x,
            'y': y,
            'points': [0,0, distance, 0, distance, 50],
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'transparent'
        }));
    }

}

class PhysicalWork extends Symbol{
    constructor(offset, share, isRight, colors) {
        super(offset);
        this.indivShare = share[0];
        this.jointShare = share[1];
        this.colors = {
            'off-task': colors['off-task'],
            'indirect': 'url(#Pattern-Indirect)',
            'direct': colors.direct
        };
        this.lastSlotIdx = 1;
        const totalLength = 250;
        const indivStart = -50;
        this.indivCount = Object.values(this.indivShare).reduce((a, b) => a + b, 0);
        this.jointCount = Object.values(this.jointShare).reduce((a, b) => a + b, 0);
        this.reduction = 2;
        this.jointWorkExists = false;
        const bothBlocks = (this.jointCount > 0 && this.indivCount > 0);
        const width = (bothBlocks) ? totalLength/8-this.reduction : totalLength/8;
        // add individual Share
        this.indivSlots = [];
        this.addShare(indivStart, width, this.indivSlots, this.indivShare, isRight, bothBlocks);
        if (this.lastSlotIdx > 0) {
            this.addBorder(this.lastSlotIdx, this.indivSlots, isRight)
        }
        this.lastIndivIdx = this.lastSlotIdx;
        
        // add joint Share
        this.jointSlots = [];
        this.jointStart = (isRight) ? -totalLength + indivStart + this.jointCount*width: totalLength + indivStart - this.jointCount*width;
        this.addShare(this.jointStart,width, this.jointSlots, this.jointShare, isRight, bothBlocks);
       
    }
    addShare(x_offset, width, slots, share, isRight, bothBlocks) {
        const num_slots = 8;
        for(let i = 0; i < num_slots; i++) { // 8 segments
            slots.push(
                {'x': (isRight && bothBlocks) ? x_offset + width*i + (num_slots)*this.reduction : x_offset + width*i, 
                'width': width} 
              );
        }
        if(isRight){
            slots.reverse()
        }
        this.lastSlotIdx = this.assignSlots(share, slots);

        
        
    }

    addBorder(i, slots, isRight) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'rect',
            'x': (isRight) ? slots[i-1].x: slots[0].x,
            'y': -350,
            'width': slots[i-1]['width']*i , //i*62.5,
            'height': 80,
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'transparent'
        }))
    }
    assignSlots(share, slots){
        let i = 0;
        for(const type of Object.keys(this.colors)) {
            for(let j = 0; j < share[type]; j++) {
                slots[i]['color'] = this.colors[type];
                this.addSlot(slots[i]);
                i++;
            }
        }
        return i;
    }
    addSlot(att) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'rect',
            'x': att['x'],
            'y': -350,
            'width': att['width']+1,
            'height': 80,
            'fill': att['color'],
            'stroke': 'transparent',
            'stroke-width': 0
        }))
    }
    addJointWork(partnerWork) {
        if(this.jointCount > 0 && partnerWork.jointCount > 0) {
            this.jointWorkExists = true;
            const first = this.jointSlots[0];
            const last = this.jointSlots[this.lastSlotIdx-1];
            const partnerFirst = partnerWork.jointSlots[partnerWork.lastSlotIdx-1];
            const partnerLast = partnerWork.jointSlots[0];
            const width = Math.abs(partnerWork.offset.x + partnerFirst.x - (this.offset.x + last.x));

            this.instructs.push(new Instruct(this.offset, {
                'type': 'rect',
                'x': last.x,
                'y': -350,
                'width': width/2, //i*62.5,
                'height': 80,
                'stroke': this.jointSlots[this.lastSlotIdx-1].color,
                'stroke-width': 5,
                'fill': this.jointSlots[this.lastSlotIdx-1].color
            }));

            this.instructs.push(new Instruct(this.offset, {
                'type': 'rect',
                'x': last.x + width/2,
                'y': -350,
                'width': width/2, //i*62.5,
                'height': 80,
                'stroke': partnerFirst.color,
                'stroke-width': 5,
                'fill': partnerFirst.color
            }));

            this.instructs.push(new Instruct(this.offset, {
                'type': 'rect',
                'x': first.x,
                'y': -350,
                'width': Math.abs(partnerWork.offset.x + partnerLast.x + partnerLast.width - (this.offset.x + first.x)), //i*62.5,
                'height': 80,
                'stroke': 'black',
                'stroke-width': 5,
                'fill': 'transparent'
            }));
            
        }
        
    }
}

class CognitiveAsymmetry extends Symbol{
    // TODO not yet tested or available in form
    constructor(offset, arrowHead) {
        super(offset);
        this.width = 230;
        this.arrowLength = 20;
        if(arrowHead == 'none') {return;}
        const sign = (arrowHead == 'left') ? -1 : 1 ;
        this.addDashedLine(sign);
        if(arrowHead != 'balanced') {this.addArrowHead(sign);}
    }
    addArrowHead(sign) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'polyline',
            'x': sign*(this.width/2 - this.arrowLength),
            'y': 0,
            'points': [0, 0, 0, this.arrowLength/2, this.arrowLength, 0, 0, -1*this.arrowLength/2, 0, 0].map(x => x*sign),
            'fill': 'black',
        }));
    }
    addDashedLine(sign) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': -0.5*(this.width - this.arrowLength),
            'y': 0,
            'd': `l ${this.width - this.arrowLength} 0`,
            'fill': 'transparent',
            'stroke': 'black',
            'stroke-width': 6,
            'stroke-dasharray':'10,10'
        }))
    }    

}

class ActorWrapper {
    constructor(offset, options, colors, isRight) {
        this.offset = {
            'x': offset.x + options['x_offset'], 
            'y':  offset.y + options['y_offset']
        }
        if(options.type == 'human') {
            this.actor = new HumanActor(this.offset, options.cogni, colors, isRight);
        } else if (options.type == 'machine'){
            this.actor = new MachineActor(this.offset, options.cogni, colors, isRight);
        } else {
            this.actor = new NoneActor(this.offset);
        }
       this.instructs = this.actor.instructs;
    }
    create() {
        return this.instructs;
    }
}

class NoneActor extends Symbol {
    // empty instructions
}

class HumanActor extends Symbol{
    constructor(offset, cogni, colors, isRight) {
        super(offset);
        this.addBottom();
        this.addBody();
        this.addLeftArm();
        this.addRightArm();
        this.addHead('white');
        this.cogni = new CognitiveHuman({'x': this.offset.x + 75, 'y': this.offset.y - 190}, cogni, colors, isRight);
        this.instructs.push(...this.cogni.create());
        this.addHead('transparent');
    }
    addHead(color) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'circle',
            'x': 75,
            'y': -190,
            'r': 40,
            'stroke': 'black',
            'stroke-width': 5,
            'fill': color
        }));
    }
    addBody() {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': 0,
            'y': 0,
            'd': 'a 75 160 0 0 1 150 0',
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'none'
        }));
    }
    addBottom() {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'line',
            'x': 0,
            'y': 0,
            'points': [0, 0, 150, 0],
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'none'
        }));
    }
    addLeftArm() {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': 40,
            'y': -120,
            'd': 'c 0 0 -80 -5 -70 -150',
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'none'
        }));
    }
    addRightArm() {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': 110,
            'y': -120,
            'd': 'c 0 0 80 5 70 -150',
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'none'
        }));
    }

}

class MachineActor extends Symbol{
    constructor(offset, cogni, colors, isRight) {
        super(offset);
        this.addBody();
        this.addLeftArm();
        this.addRightArm();
        this.cogni = new CognitiveMachine({'x':offset.x + 35, 'y': offset.y - 230}, cogni, colors, isRight);
        this.instructs.push(...this.cogni.create());
        this.addHead();
    }
    addHead() {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'rect',
            'x': 35,
            'y': -230,
            'width': 80,
            'height': 80,
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'none'
        }));
    }
    addBody(){
        this.instructs.push(new Instruct(this.offset, {
            'type': 'rect',
            'x': 0,
            'y': -150,
            'width': 150,
            'height': 150,
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'none'
        }));
    }
    addLeftArm() {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': 35,
            'y': -120,
            'd': 'l -70 0 l 0 -150',
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'none'
        }));
    }
    addRightArm() {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': 110,
            'y': -120,
            'd': 'l 70 0 l 0 -150',
            'stroke': 'black',
            'stroke-width': 5,
            'fill': 'none'
        }));
    }
}

class CognitiveWork extends Symbol {
    constructor(offset, share, colors) {
        super(offset);
        this.share = share
        this.colors = {
            'off-task': colors['off-task'],
            'indirect': 'url(#Pattern-Indirect)',
            'direct': colors.direct
        };
        this.quadrants = [];
    }
    assignQuadrants(){
        let i = 0;
        for(const type of Object.keys(this.colors)) {
            for(let j = 0; j < this.share[type]; j++) {
                this.addQuadrant(this.quadrants[i], this.colors[type])
                i++;
            }
        }
        return i;
    }
    addQuadrant(att, fill){
        // not implemented
    }
}

class CognitiveMachine extends CognitiveWork{
    constructor(offset, share, colors, isRight) {
        super(offset, share, colors);
        this.quadrants = [
            {'x': 40, 'y': 2, 'width': 41, 'height': 41},
            {'x': 40, 'y': 40, 'width': 41, 'height': 41},
            {'x': 2, 'y': 40, 'width': 41, 'height': 41},
            {'x': 2, 'y': 2, 'width': 41, 'height': 41}
        ]
        if(isRight){this.quadrants.reverse()}
        this.assignQuadrants()
    }
    addQuadrant(att, fill) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'rect',
            'x': att['x'],
            'y': att['y'],
            'width': att['width'],
            'height': att['height'],
            'fill': fill
        }));
    }
}

class CognitiveHuman extends CognitiveWork {
    constructor(offset, share, colors, isRight) {
        super(offset, share, colors);
        this.quadrants = [
            {'x': 40, 'y': 0, 'd': 'a 41 41 0 0  0, -41 -41 l 0 41'},            
            {'x': 40, 'y': 0, 'd': 'a 41 41 0 0  1, -41 41 l 0 -41'},
            {'x': -40, 'y': 0, 'd': 'a 41 41 0 0  0, 41  41 l 0 -41'},
            {'x': -40, 'y': 0, 'd': 'a 41 41 0 0  1, 41 -41 l 0 41'},
        ]
        if(isRight){this.quadrants.reverse();}
        this.assignQuadrants();
    }
    addQuadrant(att, fill) {
        this.instructs.push(new Instruct(this.offset, {
            'type': 'path',
            'x': att['x'],
            'y': att['y'],
            'd': att['d'],
            'fill': fill
        }));
    }
}
  



export {RelativeLocation, SubtaskAttribute, PhysicalWork, CognitiveAsymmetry, ActorWrapper};