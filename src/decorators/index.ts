import Config from './Config'; 
import { IResponse } from '../API'; 
import { BabelPropertyDescriptor } from './type';
import { resolve } from 'path';

export default function response(msg: any) {
    return function (target: Object, name: string | symbol, descriptor: BabelPropertyDescriptor) {
        function createResponse(oldValue: any) {  return function () { 
            let returnValue = oldValue.apply(this, arguments);
            if(!(returnValue instanceof Promise)) {
                console.warn('方法返回值不是Promise对象，装饰器无效');
                return returnValue;
            }
            return new Promise((resove, reject) => {
                returnValue.then( (res: IResponse<any>) => {
                    if(res.code === 200) {
                        if(msg) {
                            Config.Alert.success(msg, (close:any)=>{
                                close();
                                resolve(res);
                            })
                        }else {
                            resolve(res);
                        }
                    }else {
                        if(msg) {
                            Config.Alert.error(msg, (close:any)=>{
                                close();
                                reject(res);
                            })
                        }else {
                            reject(res);
                        }
                    }
                })
            })
        }
        if(descriptor.initializer){
            return {
                get: function(){
                    return createResponse(descriptor.initializer.call(this));
                }
            }
        }
        if(descriptor.value) {
            return {
                value: createResponse(descriptor.value);
            }
        }
        return descriptor;
    }
}