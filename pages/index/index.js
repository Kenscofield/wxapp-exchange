//index.js
//获取应用实例
var app = getApp()
	Page({
	    data: {
	        progressTip: ''
	    },
		onLoad : function (options) {
		    // 页面初始化 options为页面跳转所带来的参数
		},
		onReady : function () {
		    // 页面渲染完成
		},
		onShow : function () {
		    // 页面显示


		    this.setData({
		        "progressTip": "正在刷新汇率列表..."
		    });

            //1.加载汇率列表
		    var that = this;
		    wx.request({
		        url: app.globalData.fixerApi,
		        data: {},
		        method: 'GET',
		        success: function (res) {
		            //如何解析yahoo api传回来的xml？？
		            // success
		            if (res.statusCode == 200) {

		                //补充一个USD做基准利率
		                res.data.rates.USD = 1.0000;

		                wx.setStorageSync('cRates', res.data.rates);

		                //2.加载货币名称列表
		                //TODO：可能要从其他api获取，這里暂时用cRates替代
		                that.setData({
		                    "progressTip": "正在刷新货币名称..."
		                });
		                var cNames={};
		                for (var n in res.data.rates) {
		                    cNames[n] = n;
		                }
		                wx.setStorageSync('cNames', cNames);

		                //3.读取用户本地存储的已选货币列表
		                //如果没有，就默认填入四个
		                that.setData({
		                    "progressTip": "检查已选货币..."
		                });
		                var selectCurrencyList = wx.getStorageSync('selectCurrencyList') || []
		                if (selectCurrencyList.length == 0) {
		                    selectCurrencyList = [
                                { id: 1, currencyNameEN: "CNY", currencyCal: "", currencyValue: 0, currencyNameCN: "人民币￥" },
                                { id: 2, currencyNameEN: "HKD", currencyCal: "", currencyValue: 0, currencyNameCN: "港币$" },
                                { id: 3, currencyNameEN: "USD", currencyCal: "", currencyValue: 0, currencyNameCN: "美元$" },
                                { id: 4, currencyNameEN: "JPY", currencyCal: "", currencyValue: 0, currencyNameCN: "日圆$" },
		                    ];

		                    wx.setStorageSync('selectCurrencyList', selectCurrencyList);
		                }
		                

		                //4.读取用户本地存储的默认选中货币Id
		                //如果没有，默认为2
		                var highlightedId = wx.getStorageSync('highlightedId') || 0;
		                if (highlightedId == 0) {
		                    highlightedId = 2;

		                    wx.setStorageSync('highlightedId', highlightedId);
		                }


		                //5.所有准备工作完成，redirect到main
		                that.setData({
		                    "progressTip": "正在载入首页..."
		                });
		                wx.redirectTo({
		                    url: '../main/main'
		                })

		            }
		            console.log(res);
		        },
		        fail: function () {
		            // fail
		        },
		        complete: function () {
		            // complete
		        }
		    })
		   





		},
		onHide : function () {
			// 页面隐藏
		},
		onUnload : function () {
			// 页面关闭
		},
		currencyClick: function (event) {
		    
		    //由于点击发生在currency-group内部的view上，
		    //所以這里用event.currentTarget，而不是event.target
		    var id = parseInt(event.currentTarget.dataset.cid, 10);
		    if (id === this.data.highlightedId) {
		        return;
		    }

		    //切换当前选中的货币，同时做一些清理工作
		    this.data.currencyList[this.findCurrencyIndex(this.data.highlightedId)].currencyCal = "";
		    this.setData({ "highlightedId": id });

		    var newHighlight = this.data.currencyList[this.findCurrencyIndex(this.data.highlightedId)];
		    this.setData({ "screenData": newHighlight.currencyValue.toString() });
		},
		updateCurrencyList: function (event) {

		    console.log('updated!');

		    var baseCurIndex = this.findCurrencyIndex(this.data.highlightedId);
		    var fromCur = this.data.currencyList[baseCurIndex].currencyNameEN;

		    var reg = /\+|－|×|÷/;

		    console.log(this.data.screenData);
		    console.log(this.data.screenData.search(reg));

		    for (var i = 0; i < 4; i++) {
		        if (i == baseCurIndex) {
		            var obj = {};
		            obj["currencyList[" + i + "].currencyValue"] = this.data.calResult;
		            obj["currencyList[" + i + "].currencyCal"] = this.data.screenData.search(reg) > -1 ? this.data.screenData : "";
		            this.setData(obj);
		        } else {
		            var rates = app.globalData.currencyList;
		            var toCur = this.data.currencyList[i].currencyNameEN;

		            var obj = {};
		            obj["currencyList[" + i + "].currencyValue"] = this.data.calResult * rates[toCur] / rates[fromCur];
		            obj["currencyList[" + i + "].currencyCal"] = "";

		            this.setData(obj);
		        }
		    }
		},
		clickBtn: function (event) {
		    
		    var id = event.target.id;

			if (id == this.data.idb) { //退格←
				var data = this.data.screenData;
				if (data == "0") {
					return;
				}

				data = data.substring(0, data.length - 1);
				if (data == "" || data == "－") {
					data = 0;
				}

				this.setData({
					"screenData" : data
				});

				this.setData({
				    "calResult": this.cal(data)
				});

			}  else {
				if (this.data.operaSymbo[id]) { //如果是符号+-*/
					if (this.data.lastIsOperaSymbo || this.data.screenData == "0") {
						return;
					}
				}

				var sd = this.data.screenData;
				var data;
				if (sd == 0) {
					data = id;
				} else {
					data = sd + id;
				}
				this.setData({
					"screenData" : data
				});

				if (this.data.operaSymbo[id]) {
					this.setData({
						"lastIsOperaSymbo" : true
					});
				} else {
					this.setData({
						"lastIsOperaSymbo" : false
					});

					this.setData({
					    "calResult": this.cal(data)
					});
				}
			}

			this.updateCurrencyList();
		},
		cal: function (screenData) {

		    //eval是js中window的一个方法，而微信页面的脚本逻辑在是在JsCore中运行，
		    //JsCore是一个没有窗口对象的环境，所以不能再脚本中使用window
		    //var result = eval(newData);

		    var lastWord = screenData.charAt(screenData.length);
		    if (isNaN(lastWord)) {
                //TODO ?
		        return;
		    }

		    var num = "";

		    var lastOperator = "";
		    var arr = screenData.split('');
		    var optarr = [];

		    for (var i in arr) {
		        if (isNaN(arr[i]) == false || arr[i] == this.data.idd || arr[i] == this.data.idt) {
		            num += arr[i];
		        } else {
		            lastOperator = arr[i];
		            optarr.push(num);
		            optarr.push(arr[i]);
		            num = "";
		        }
		    }
		    optarr.push(Number(num));

		    var result = Number(optarr[0]) * 1.0;
		    console.log(result);

		    for (var i = 1; i < optarr.length; i++) {
		        if (isNaN(optarr[i])) {
		            if (optarr[1] == this.data.idadd) {
		                result += Number(optarr[i + 1]);
		            } else if (optarr[1] == this.data.idj) {
		                result -= Number(optarr[i + 1]);
		            } else if (optarr[1] == this.data.idx) {
		                result *= Number(optarr[i + 1]);
		            } else if (optarr[1] == this.data.iddiv) {
		                result /= Number(optarr[i + 1]);
		            }
		        }
		    }

		    console.log(result);

		    return result;
		},
		findCurrencyIndex: function (id) {
		    var index = -1;

		    for (var i = 0; i < 4; i++) {
		        if (this.data.currencyList[i].id == id) {
		            return i;
		        }
		    }

		    return index;
		},
		logs : function () {
			wx.navigateTo({
				url : '../logs/logs'
			})
		}
	})