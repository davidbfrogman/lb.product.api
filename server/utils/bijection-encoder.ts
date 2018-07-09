export class BijectionEncoder{

    public static readonly alphabet: string = "ABCDEFGHJKLMNPQRSTVWXYZ23456789";
    public static readonly base: number = BijectionEncoder.alphabet.length;

    public static encode(value: number): string{
        let logged = false;
        if(value % 100 === 0){
            //console.log(`Encoding ${value}`);
            logged = true;
        }
        
        if (value == 0) {
            return this.alphabet[0];
        }
        
        var encodedId: string = '';
        
        while (value > 0)
        {  
            encodedId += this.alphabet[value % this.base];
            value = Math.floor(value / this.base);
        }
        if(logged){
            //console.log(`Resulting Value from encoding:  ${encodedId.split('').reverse().join('')}`);
        }
        return encodedId.split('').reverse().join('');
    }

    public static decode(value: string): number{

        var decodedId = 0;

        for (var j = 0; j < value.length; j++) {
            var element = value[j];
            decodedId = (decodedId * this.base) + this.alphabet.indexOf(element);
        }
        if(decodedId % 100 == 0){
            //console.log(`resulting decoded value: ${decodedId}`);
        }
        
        return decodedId;
    }
}