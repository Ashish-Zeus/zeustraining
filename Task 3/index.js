function factorial(num){
    let arr=[1];
    if(num===0 || num===1) return [1];

    for(let i=2;i<=num;i++){
        let carry = 0;
        for(let j=0;j<arr.length;j++){
            let prod = arr[j]*i + carry;
            arr[j] = prod%10;
            carry = Math.floor(prod/10);
        }
        while(carry){
            arr.push(carry%10);
            carry = Math.floor(carry/10);
        }
    }
    arr.reverse();
    return arr;
}


for(let i=0;i<=1000;i++){
    ans = factorial(i);
    let str = ans.join('');
    console.log(`Factorial of ${i} is ${str}`);
}

console.log(factorial(1000).length);


