const body = document.querySelector('body');
body.style.margin = 0;

class ParentDiv {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'parent_div';
        this.element.style.cssText = `
            height:100vh;
            background: black;
            margin: 0;
            position: relative;
            overflow: hidden;
            touch-action : none;
        `;
        document.body.appendChild(this.element);
    }
}

class ChildDiv {
    constructor(parentElement) {
        this.element = document.createElement('div');
        this.element.className = 'child_div';
        this.element.style.cssText = `
            height: 50px;
            width: 50px;
            background: red;
            cursor: grab;
            position: absolute;
            left: 0;
            top: 0;
        `;
        parentElement.appendChild(this.element);
    }

    startDragging(e) {
        e.preventDefault();
        const offsetX = e.clientX - childDIvElement.getBoundingClientRect().left;
        const offsetY = e.clientY - childDIvElement.getBoundingClientRect().top;

        document.addEventListener('pointermove', onpointerMove);
        document.addEventListener('pointerup', stopDragging);

        function onpointerMove(e) {
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            const containerRect = parentDivElement.getBoundingClientRect();
            const elementWidth = childDIvElement.offsetWidth;
            const elementHeight = childDIvElement.offsetHeight;

            newX = Math.max(containerRect.left, Math.min(newX, containerRect.right - elementWidth));
            newY = Math.max(containerRect.top, Math.min(newY, containerRect.bottom - elementHeight));

            
            childDIvElement.style.left = (newX - containerRect.left) + 'px';
            childDIvElement.style.top = (newY - containerRect.top) + 'px';
        }

        function stopDragging() {
            document.removeEventListener('pointermove', onpointerMove);
            document.removeEventListener('pointerup', stopDragging);
        }
    }
}

const parentDiv = new ParentDiv();
const childDiv = new ChildDiv(parentDiv.element);

const childDIvElement = childDiv.element;
const parentDivElement = parentDiv.element;

childDIvElement.addEventListener('pointerdown', childDiv.startDragging);


window.addEventListener('resize', () => {
    const parentRect = parentDivElement.getBoundingClientRect();
    const childRect = childDIvElement.getBoundingClientRect();

    let left = parseFloat(childDIvElement.style.left) || 0;
    let top = parseFloat(childDIvElement.style.top) || 0;

    const maxLeft = parentRect.width - childDIvElement.offsetWidth;
    const maxTop = parentRect.height - childDIvElement.offsetHeight;

    left = Math.min(left, maxLeft);
    top = Math.min(top, maxTop);

    childDIvElement.style.left = left + 'px';
    childDIvElement.style.top = top + 'px';
});



// const body = document.querySelector('body');
// body.style.margin = 0;
// body.style.display = 'flex';
// body.style.flexWrap = 'wrap';
// body.style.gap = '5px';
// body.style.padding = '5px';
// body.style.boxSizing = 'border-box';

// class ParentDiv {
//     constructor(index) {
//         this.element = document.createElement('div');
//         this.element.className = 'parent_div';
//         this.element.style.cssText = `
//             height: 200px;
//             width: 200px;
//             background: black;
//             position: relative;
//             overflow: hidden;
//         `;
//         body.appendChild(this.element);
//     }
// }

// class ChildDiv {
//     constructor(parentElement) {
//         this.element = document.createElement('div');
//         this.element.className = 'child_div';
//         this.element.style.cssText = `
//             height: 50px;
//             width: 50px;
//             background: red;
//             cursor: grab;
//             position: absolute;
//             left: 0;
//             top: 0;
//         `;
//         parentElement.appendChild(this.element);
//         this.makeDraggable(parentElement);
//     }

//     makeDraggable(parent) {
//         const child = this.element;

//         child.addEventListener('pointerdown', function startDragging(e) {
//             e.preventDefault();

//             const offsetX = e.clientX - child.getBoundingClientRect().left;
//             const offsetY = e.clientY - child.getBoundingClientRect().top;

//             function onpointerMove(e) {
//                 const parentRect = parent.getBoundingClientRect();

//                 let newX = e.clientX - offsetX;
//                 let newY = e.clientY - offsetY;

//                 const maxLeft = parentRect.right - child.offsetWidth;
//                 const maxTop = parentRect.bottom - child.offsetHeight;

//                 newX = Math.max(parentRect.left, Math.min(newX, maxLeft));
//                 newY = Math.max(parentRect.top, Math.min(newY, maxTop));

//                 child.style.left = (newX - parentRect.left) + 'px';
//                 child.style.top = (newY - parentRect.top) + 'px';
//             }

//             function stopDragging() {
//                 document.removeEventListener('pointermove', onpointerMove);
//                 document.removeEventListener('pointerup', stopDragging);
//             }

//             document.addEventListener('pointermove', onpointerMove);
//             document.addEventListener('pointerup', stopDragging);
//         });

//         window.addEventListener('resize', () => {
//             const parentRect = parent.getBoundingClientRect();
//             const childLeft = parseFloat(child.style.left) || 0;
//             const childTop = parseFloat(child.style.top) || 0;

//             const maxLeft = parentRect.width - child.offsetWidth;
//             const maxTop = parentRect.height - child.offsetHeight;

//             child.style.left = Math.min(childLeft, maxLeft) + 'px';
//             child.style.top = Math.min(childTop, maxTop) + 'px';
//         });
//     }
// }

// for (let i = 0; i < 50; i++) {
//     const parent = new ParentDiv(i);
//     new ChildDiv(parent.element);
// }
