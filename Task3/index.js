console.time('label')
let base = 100000
let b = 5
function factorial(num){
    let arr=[1];
    if(num===0 || num===1) return [1];

    for(let i=2;i<=num;i++){
        let carry = 0;
        for(let j=0;j<arr.length;j++){
            let prod = arr[j]*i + carry;
            arr[j] = prod%base;
            carry = Math.floor(prod/base);
        }
        while(carry){
            arr.push(carry%base);
            carry = Math.floor(carry/base);
        }
    }
    arr.reverse();
    let resultStr = arr.map((val, idx) => {
        if (idx === 0) return val.toString();
        return val.toString().padStart(b, '0');
    }).join('');
    return resultStr;
}

console.timeEnd('label')
// for(let i=0;i<=1000;i++){
//     ans = factorial(i);
//     let str = ans.join('');
//     console.log(`Factorial of ${i} is ${str}`);
// }
// ans = factorial(50000);
// let str = ans.join('');

// console.log(str);
console.log(factorial(100));

// console.log(factorial(1000).length);


