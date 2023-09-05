import {getRadioValue, getCheckValues, getShare, getColors} from './etc.js';
import { RelativeLocation, SubtaskAttribute, CognitiveAsymmetry, ActorWrapper, PhysicalWork} from './symbols.js';

const width = 700, height = 500;

document.addEventListener("DOMContentLoaded", function() {
    const sliders = document.getElementsByClassName('slider');
    for(const slider of sliders){
    slider.oninput = function() {
        updateSliderLabel(slider);
        equilibrate(slider);
    }
    slider.oninput();                                
    }

    const boxes = document.getElementsByClassName('joint-phy-subtask');
    for(const box of boxes) {
        box.onchange = function () {
            for(const b of boxes) {
                b.checked = box.checked;
            }
        }
    }

    const inputs = document.querySelectorAll('input');
    for(const input of inputs) {
        input.addEventListener('change', generateTdp);
    }
    generateTdp();
});

document.getElementById('btn-download').addEventListener('click', () => {
    //download SVG
    const svg = document.getElementById('svg-tdp');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    const base64doc = btoa(svg.outerHTML);

    const a = document.createElement('a');
    a.download = 'tdp' + getTimeSuffix() + '.svg';
    a.href = 'data:image/svg+xml;base64,' + base64doc;

    const even = new MouseEvent('click');
    a.dispatchEvent(even);
});


function getTimeSuffix() {
    const now = new Date();
    return `_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;

}

    
function generateTdp () {   
    // generate TDP as .svg file
    // array of drawing instructions

    // Offset from top-left corner of svg frame
    const offset = {'x': 0, 'y': 0};
    
    
    const leftOptions = {
        'isRight':  false,
        'type':     getRadioValue('left-actor-type'),
        'phy':      [getShare('left-indiv-phy'), getShare('left-joint-phy')],
        'cogni':    getShare('left-cogni'),
        'x_offset': 100,
        'y_offset': 450
    }

    const rightOptions = {
        'isRight':  true,
        'type':     getRadioValue('right-actor-type'),
        'phy':      [getShare('right-indiv-phy'), getShare('right-joint-phy')],
        'cogni':    getShare('right-cogni'),
        'x_offset': 450,
        'y_offset': 450
    }
    const subtasks = getCheckValues('switch');
    const colors = getColors('color');

    const elements = [];
    // add left actor with cognitive and physical work
    const leftActor = new ActorWrapper(offset, leftOptions, colors);
    elements.push(...leftActor.create());
    // add  right actor with cognitive and physical work
    const rightActor = new ActorWrapper(offset, rightOptions, colors);
    elements.push(...rightActor.create());

    const leftPhyWork = new PhysicalWork(leftActor.offset, leftOptions.phy, leftOptions.isRight, colors);
    const rightPhyWork = new PhysicalWork(rightActor.offset, rightOptions.phy, rightOptions.isRight, colors)
    leftPhyWork.addJointWork(rightPhyWork);
    elements.push(...rightPhyWork.create());
    elements.push(...leftPhyWork.create());

    elements.push(...new SubtaskAttribute({'x': width/2, 'y': 0}, leftPhyWork, rightPhyWork, subtasks, colors.superior).create())
    
    // add Relative Location
    elements.push(...new RelativeLocation(offset, getRadioValue('LocatedRelativeTo')).create());
    // add cognitive Asymmetry
    elements.push(...new CognitiveAsymmetry({'x': width/2, 'y': height/2}, getRadioValue('asymmetry')).create());

    // add instructions to svg element
    drawTdp('svg-tdp', getPattern(colors.indirect, colors.direct), elements)
}

function drawTdp (svgId, pattern, elements) {
    const svg = document.getElementById(svgId);
    // add pattern for indirect work and delete previous TDP
    svg.innerHTML = pattern;
    // draw all instructions
    for (const e of elements) {
        svg.appendChild(e.draw());
    }
}

/// Support functions for slider updating
function equilibrate(slider) {
    const sliderClasses = slider.className.split(' ').filter(e => !['slider', 'is-medium', 'has-ouput', 'is-fullwidth','is-primary'].includes(e) );                
    if(sliderClasses.length == 0) {return}
    const sliders = document.getElementsByClassName(sliderClasses[0]); 
    let sum = 0;

    const diff_sliders = []
    for(const s of sliders) {
        sum += Number(s.value);
        if(s.value > 0 && s !== slider) {
            diff_sliders.push(s)
        }
    }
    diff_sliders.reverse()
    const diff = sum - Number(slider.max);
    for(let i = 0; i < diff; i++) {
        let s = diff_sliders[i % diff_sliders.length];
        s.value -= 1;
        updateSliderLabel(s)
    }
    updateUnassignedLabel(
        sliderClasses[0], 
        (Math.min(0,  diff/Number(slider.max)))* -100
        );                
}
function updateUnassignedLabel (className, value){
    let lbl = document.getElementById(className + '-unassigned');
    lbl.innerHTML = 'Unassigned: ' + value + ' %';
    
}
function updateSliderLabel (slider){
    let lbl = document.getElementById(slider.id + '-value');
    lbl.value = slider.value; 
    lbl.innerHTML = slider.value / slider.max * 100 + ' %';
}

function getPattern(bg, fg) {
    return  `
    <defs>
        <pattern id="Pattern-Indirect" width="7" height="7" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="100" fill="${bg}"/>
            <line x1="4" y1="0" x2="4" y2="7" stroke="${fg}" stroke-width="2"/>
            <line x1="0" y1="4" x2="7" y2="4" stroke="${fg}" stroke-width="2"/>
        </pattern>
    </defs>`;
}


