// Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const EvmChains = window.EvmChains;
const Fortmatic = window.Fortmatic;
  
 // Web3modal instance
let web3Modal
  
 // Chosen wallet provider given by the dialog window
let provider;
  
  
 // Address of the selected account
let selectedAccount = "";
let balanceBnb = "";
let jwtToken = "";
const env = {
    BSCSCAN: "https://testnet.bscscan.com/address/",
    TOKEN: ""
};
   
 /**
  * Setup the orchestra
  */
function init() { 
    cc.log("Initializing example");
    // cc.log("WalletConnectProvider is", WalletConnectProvider);
    // cc.log("Fortmatic is", Fortmatic);

    // Tell Web3modal what providers we have available.
    // Built-in web browser provider (only one can exist as a time)
    // like MetaMask, Brave or Opera is added automatically by Web3modal
    const providerOptions = {
        walletconnect: {
            package: window.WalletConnectProvider.default,
            options: {
                rpc: {
                    '1': 'https://bsc-dataseed1.defibit.io',
                    '56': 'https://bsc-dataseed1.defibit.io',
                },
            }
        }
    };

    web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions, // required
    });
}
 
 init();
 
 /**
  * Kick in the UI action after Web3modal dialog has chosen a provider
  */
async function fetchAccountData() {

    // Get a Web3 instance for the wallet
    const web3 = new Web3(provider);

    cc.log("Web3 instance is", web3);  

    // Get list of accounts of the connected wallet
    const accounts = await web3.eth.getAccounts();

    // MetaMask does not give you all accounts, only the selected account
    cc.log("Got accounts", accounts);
    selectedAccount = accounts[0];  

    // Go through all accounts and get their ETH balance
    const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    // ethBalance is a BigNumber instance
    // https://github.com/indutny/bn.js/
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);   
    balanceBnb = humanFriendlyBalance;

    //update data
    selectedAccount = selectedAccount.substring(0, 15)+"...";
        try {
            if (jwtToken == "") {
                $.get({url: API_BACKEND+"/author/authentication/"+accounts[0]
                    , success: function(result){
                        const msg =web3.utils.fromUtf8(result);             
                        console.log(msg);
                        var from = accounts[0];
                        var params = [from, msg];
                        var method = 'eth_sign';
                        web3.currentProvider.sendAsync(
                            {
                            method,
                            params,
                            from,
                            }, function (err, signature) {
                                if(err == null) {
                                    $.get({url: API_BACKEND+"/author/auth/"+accounts[0]+"/"+signature.result
                                    , success: function(result){
                                            jwtToken = result;

                                            funcSetup(jwtToken);
                                            GetInfo();
                                            GetAllCard();
                                            GetAllCardByAddress();
                                            GetAllItems();
                                            GetAllItemsByAddress();
                                        }
                                    });
                                }
                        });
                    }
                    , error: function(err) {
                        console.log(err);
                    }
                });
            }
            
            if (typeof _popup == 'undefined') return; 
            _popup.getChildByTag(config.popup_default).getChildByTag(config.popup_wallet).setString(selectedAccount);
            _popup.getChildByTag(config.popup_default).getChildByTag(config.popup_wallet_balance).setString(balanceBnb+" BNB");

            
        } catch(e) {
            cc.log("Error update", e);
        }
    });

    // Because rendering account does its own RPC commucation
    // with Ethereum node, we do not want to display any results
    // until data for all accounts is loaded
    await Promise.all(rowResolvers);
}
   
   
   
/**
* Fetch account data for UI when
* - User switches accounts in wallet
* - User switches networks in wallet
* - User connects wallet initially
*/
async function refreshAccountData() {
    await fetchAccountData(provider);
}

   
/**
* Connect wallet button pressed.
*/
async function onConnect() {

    cc.log("Opening a dialog", web3Modal);
    try {
        if(selectedAccount == ""){
            provider = await web3Modal.connect();
        }
    } catch(e) {
        cc.log("Could not get a wallet connection", e);
    return;
    }

    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts) => {
        fetchAccountData();
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId) => {
        fetchAccountData();
    });

    // Subscribe to networkId change
    provider.on("networkChanged", (networkId) => {
        fetchAccountData();
    });

    await refreshAccountData();
}
   
/**
* Disconnect wallet button pressed.
*/
async function onDisconnect() {

    cc.log("Killing the wallet connection", provider);

    // TODO: Which providers have close method?
    if(provider.close) {
        await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
        await web3Modal.clearCachedProvider();
        provider = null;
    }

    selectedAccount = "";
    balanceBnb = "";
    jwtToken = "";
    _popup.getChildByTag(config.popup_default).getChildByTag(config.popup_wallet).setString(lb.wallet_address_value);
    _popup.getChildByTag(config.popup_default).getChildByTag(config.popup_wallet_balance).setString(lb.coin_info_value);
   
    cc.director.runScene(new cc.TransitionFade(0.5, new LoadingScene()));
    IS_LOAD_PAGE = true;
}

window.onbeforeunload = function(event){
    if(IS_VS_PAGE == true) {
        return confirm(lb.msg_leave_play);
        } else {
        return confirm(lb.msg_leave);
    }  
};

const max_card_hub = 8;
const max_scope = 10;
const SYS_WARRRIOR = "Warrrior"
const SYS_TANGER = "Tanker"
const SYS_MAGICIAN = "Magic"
const SYS_ARCHER = "Archer"
var IS_LOAD_PAGE = false;
var IS_VS_PAGE = false;
var IS_CALL_BACK = false; //call function reload
const API_BACKEND = "https://api1.critterland.world";
//const API_BACKEND = "http://127.0.0.1:4000";
const AUTHORIZATION = "AUTHORIZATION";
var isProcessLogin = false;
function funcSetup(val) {
    $.ajaxSetup({
        headers: { AUTHORIZATION: val }
    });
}

function GetInfo() {
    $.get({
        url: API_BACKEND+"/account/info",
        success: function(result) { 
           user.coinG = result.coin;
           user.level = result.level;
           user.index = result.index;
           user.name = result.name;
           user.IsBlessedFountains = result.is_blessed_fountains;
           if(user.index == -1) {//first
                cc.director.runScene(new cc.TransitionFade(0.5, new FirstScene()));
           } else {
                cc.director.runScene(new cc.TransitionFade(0.5, new HomeMapScene()));
           }
        }
     }); 
}

function UpdateInfoData() {
    $.get({
        url: API_BACKEND+"/account/info",
        success: function(result) { 
           user.coinG = result.coin;
           user.level = result.level;
           user.index = result.index;
           user.name = result.name;
           user.IsBlessedFountains = result.is_blessed_fountains;

           if (typeof _item == 'undefined') return 
           if(user.IsBlessedFountains > -1) {
                _item.loadTextures(itemsBlessedFounTain[user.IsBlessedFountains].src); 
           }
        },
        error: function() {
            if(IS_LOAD_PAGE== false) {
                cc.director.runScene(new cc.TransitionFade(0.5, new LoadingScene()));
                onDisconnect();
            }
        }
     }); 
} 

function UpdateInfo() {
    $.get({
        url: API_BACKEND+"/account/update/"+user.index+"/"+user.name,
        success: function(result) { 
           user.index = result.index;
        }
     }); 
}

function GetAllCard() {
    $.get({
        url: API_BACKEND+"/card/all",
        success: function(result) { 
           cards = result;
           cardsWarrrior = cards.filter(function(card){return card.sys===SYS_WARRRIOR});
           cardsArcher = cards.filter(function(card){return card.sys===SYS_ARCHER});
           cardsRanger = cards.filter(function(card){return card.sys===SYS_TANGER});
           cardsMagician = cards.filter(function(card){return card.sys===SYS_MAGICIAN});
        }
     }); 
}

function GetAllCardByAddress() {
    $.get({
        url: API_BACKEND+"/card/user/all",
        success: function(result) { 
           user.allCards = result;
           user.cards = result.filter(function(card){return card.card_hub === -1});
           user.hubs = result.filter(function(card){return card.card_hub > -1});
        }
     }); 
}

function UpdateCardHub() {
    if(user.hubs.length < 1) return
    $.ajax({
        url: API_BACKEND+"/card/user/hub",
        type:"POST",
        data: JSON.stringify(user),
        dataType:"json",       
        success: function(result) {            
        }
    });
}

function BuyCard(coin) {
    $.ajax({
        url: API_BACKEND+"/card/user/buy/"+coin,
        type:"POST",
        dataType:"json",       
        success: function(result) {   
            user.buyCards = result;         
            cc.director.runScene(new cc.TransitionFade(0.5, new GetCardsActionScene()));

            UpdateInfoData();
            GetAllCardByAddress();
        },
        error: function(){
            _warmErrorCoin.runAction(cc.sequence(
                cc.fadeIn(1),
                cc.fadeOut(1)
            ));
        }
    });
}

function FindData(arr, id) {
    return arr.find(element => element.id == id);
}
function ConfirmCampaign() {
    return confirm(lb.msg_leave_play) 
}
function Campage(name, scene) {
    if (typeof name == 'undefined') return
    $.ajax({
        url: API_BACKEND+"/campage/get/"+name,
        type:"GET",
        dataType:"json",       
        success: function(result) {  
            console.log(result) ;
            if(result <= 0) {
                _warmErrorCoinCampage.runAction(cc.sequence(
                    cc.fadeIn(1),
                    cc.fadeOut(1)
                ));
            } else {
                user.idProcss = result; //for next process
                cc.director.runScene(new cc.TransitionFade(0.5, scene));
                UpdateInfoData();
            }           
        },
        error: function(){
            onDisconnect();
        }
    });
} 

function CampageEnd() {
    if (user.isProcss == false) {
        user.isProcss == true;
    }
    $.ajax({
        url: API_BACKEND+"/campage/get/"+user.idProcss,
        type:"POST",
        dataType:"json",   
        data: JSON.stringify(user),    
        success: function(result) {  
            IS_CALL_BACK = true;
            user.isProcss == false;
            console.log(result)   ;
            data = result.cards_boot;
            user.reward = result.user_reward;
        },
        error: function(){
            onDisconnect();
        }
    });
} 

function GetAllItems() {
    $.get({
        url: API_BACKEND+"/item/all",
        success: function(result) { 
           allItems = result;
        }
     }); 
}

function GetAllItemsByAddress() {
    $.get({
        url: API_BACKEND+"/item/user/all",
        success: function(result) { 
           user.items = result;
        }
     }); 
}

function BuyItem(idItem) {
    $.ajax({
        url: API_BACKEND+"/item/buy/"+idItem,
        type:"POST",
        dataType:"json",       
        success: function(result) {           
            UpdateInfoData();
            GetAllItemsByAddress();

            _popupStore.runAction(cc.moveTo(1, cc.p(config.size_width/2, config.size_height*2)).easing(cc.easeElasticInOut(0.5)));
            _msgBuyItemSuccess.runAction(cc.sequence(
                cc.fadeIn(1),
                cc.fadeOut(1)
            ));
            _lbCoinG.setString(''+user.coinG);
        },
        error: function(){
            _warmErrorCoinStore.runAction(cc.sequence(
                cc.fadeIn(1),
                cc.fadeOut(1)
            ));
        }
    });
}

function GetFreeItem() {
    $.get({
        url: API_BACKEND+"/item/free/item",
        success: function(result) { 
           user.items = result;

           _msgGetItemSuccess.runAction(cc.sequence(
            cc.fadeIn(1),
            cc.fadeOut(1)
            ));
            UpdateInfoData();
            GetAllItemsByAddress();
        },
        error: function(){
            _msgErrorItemFree.runAction(cc.sequence(
                cc.fadeIn(1),
                cc.fadeOut(1)
            ));
        }
     }); 
}
