import { resolve } from "path"
import { promises } from "fs"

export class API {
  async _request<T>(
    url: string,
    params: any,
    method: string,
    config: {
      loading: any
      timeout: any
      multipart: any
      transformResponse?: (res: object) => IResponse<any>
      adaptor?: AudioParamDescriptor
      alertErr?: boolean
      customHeaders?: any
    }
  ) {
    config.loading && this.spin.showLoading()
    const disableSubmitAgain = method === 'POST' || method === 'PUT'
    let submitBtns: any
    if (disableSubmitAgain) {
      submitBtns = document.querySelectorAll(
        '.page-container-visible button[type="submit"], .js-submit'
      )
      submitBtns.forEach((btn: any) => {
        btn.disabled = true
      })
    }

    let request: any = null
    let urlInfo = this._makeURL(url, params, method)
    let reqUrl = urlInfo.url
    let timeout = config.timeout || this._config.timeout
    const restParams = urlInfo.params
    const isLoginAction = url.includes('/api/v2/users/login')
    const headers = new Headers()

    if (!config.multipart) {
      headers.append('Content-Type', 'application/json')
    }

    // API Headers 追加token数据
    if (params && params.getSSOToken) {
      const nowTime = new Date().getTime()
      const timeout = nowTime - TokenData.cacheTime > 1000 * 60 * 60
      if (TokenData.Authorization && TokenData.RefreshTokenId && !timeout) {
        config.customHeaders = {
          ...config.customHeaders,
          Authorization: TokenData.Authorization,
          RefreshTokenId: TokenData.RefreshTokenId,
        }
      } else {
        const results = await this.get('/amReturnCookie')
        config.customHeaders = {
          ...config.customHeaders,
          Authorization: '',
          RefreshTokenId: '',
        }
        if (results.code === 200 && results.data) {
          const { Authorization, RefreshTokenId } = results.data as any
          const saveTime = new Date().getTime()
          config.customHeaders.Authorization = Authorization
          config.customHeaders.RefreshTokenId = RefreshTokenId
          TokenData.Authorization = Authorization
          TokenData.RefreshTokenId = RefreshTokenId
          TokenData.cacheTime = saveTime
        }
      }
    }

    if (!isLoginAction) {
      // 除登录请求外的所有请求处理
      //
      let header = this._handleHeader(params, config)
      for (let p in header) {
        headers.append(p, header[p])
      }
    } else {
      const mac = localStorage.getItem('mac')
      mac && headers.append('mac', mac)
    }

    // 追加时间戳
    reqUrl = API.updateSearchStr(reqUrl, `_t=${new Date().getTime()}`)
    const controller = new AbortController()
    let signal = controller.signal

    let headerMap = {}
    // ***

    if (method === 'GET') {
      request = new Request(reqUrl, {
        headers: headerMap,
        method,
        credentials: 'include',
        signal,
      })
    } else {
      request = new Request(reqUrl, {
        headers: headerMap,
        body:
          config.multipart === true
            ? this.handleExParams(params)
            : JSON.stringify(restParams),
        method,
        credentials: 'include',
        signal,
      })
    }

    let st: any = null

    // 当promise被处理之后回调
    const onFinished = () => {
      config.loading && this.spin.showLoading()
      if (disableSubmitAgain) {
        submitBtns.forEach((btn: any) => {
          btn.disabled = false
        })
      }
    }

    const promise = new Promise((resolve, reject) => {
        const adaptor = config.adaptor || API.adaptor;
        const result = adaptor && adaptor({request, params}) || fetch(request);
        result.then(response => {
            if(response.ok) {
                return response.json();
            }
            reject && reject({
                code: response.status,
                msg: response.statusText,
                msgDetail: response
            });
            throw new Error(response.statusText);
        }).then(res => {
            // ...

            if(res.code === 401) {
                config.alertErr.confirm(`${res.msg},是否跳转至登录页？`，{
                    onOk: (close:any) => {
                        config.logout();
                        close();
                    }
                })
                resolve(res);
            }
        }).catch(error => {
            if(error && error.message === 'Unauthorized') {

            }
            const result = {
                code: 500,
                msg: 'xxx'
            };
            resolve(result);
        }).finally(()={
            st && st.clearTimeout(st);
            onFinished();
        });
        
    });

    if(timeout !== -1) {
        const abortDelay = timeout || 60 * 1000;
    
    let abortPromise = new Promise((resolve,reject) => {

    })
    return Promise.race([promise, abortPromise]);
    }else {
        return promise;
    }
  }

  get<T>(url: string, params?: object, config?: any) {
    return this._request(url, params || {}, 'GET', {
      loading: false,
      ...config,
    }) as Promise<IResponse<T>>
  }
}
