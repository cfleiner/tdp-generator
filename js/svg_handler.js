class Instruct {
    constructor(point, attributes) {
        attributes['x'] += point['x'];
        attributes['y'] += point['y'];
        switch(attributes['type']) {
            case 'line':
                this.svg = new Line(attributes);
              break;
            case 'rect':
                this.svg = new Rect(attributes);
              break;
            case 'circle':
                this.svg = new Circle(attributes);
                break;
            case 'polyline':
                this.svg = new Polyline(attributes);
                break;
            case 'path':
                this.svg = new Path(attributes);
                break;
            case 'text':
                this.svg = new SvgText(attributes);
                break;
            default:
                this.svg = new SvgElement(attributes);
          }
    }
    draw() {
        return this.svg.draw();
    }
}

class SvgElement {
    constructor(attributes) {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", attributes['type']);
        this.att = attributes;
        this.x = this.att['x'];
        this.y = this.att['y'];
    }
    draw() {
        for (const [key, value] of Object.entries(this.att)) {
            this.svg.setAttribute(key, value);
        }
        return this.svg;
    }
}

class Line extends SvgElement {
    constructor(attributes) {
        super(attributes);
        const points = this.att['points'];
        this.att['x1'] = points[0] + this.x ;
        this.att['y1'] = points[1] + this.y ;
        this.att['x2'] = points[2] + this.x ;
        this.att['y2'] = points[3] + this.y ;
    }
    
}

class Polyline extends SvgElement {
    constructor(attributes) {
        super(attributes);
        this.att['points'] = this.movePoints(this.att['points']).toString();
    }
    movePoints(points) {
        for (let i = 0; i < points.length; i = i + 2) {
            points[i]   += this.x;
            points[i+1] += this.y;
        }
        return points
    }
}

class Rect extends SvgElement {
    // nothing to change here
}

class Circle extends SvgElement {
    constructor(attributes) {
        super(attributes);
        this.att['cx'] = this.x;
        this.att['cy'] = this.y;
    }
}


class Path extends SvgElement {
    constructor(attributes) {
        super(attributes);
        this.att['d'] = this.addM() + this.att['d'];
    }
    addM() {
        return `M ${this.x} ${this.y} ` 
    }
}

class SvgText extends SvgElement {
    constructor(attributes) {
        super(attributes);
        this.svg.textContent = this.att['textContent']
    }
}

export{Instruct};


