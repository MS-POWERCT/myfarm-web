export function checkWeb3Support() {
  if (isMiniProgram()) {
    return {
      supported: false,
      reason: 'mini_program_not_support',
      message: '小程序暂不支持 Web3 登录'
    }
  }

  const wallet = detectWallet()
  if (!wallet.detected) {
    return {
      supported: false,
      reason: 'no_wallet',
      message: '未检测到加密钱包，请先安装 MetaMask 等钱包插件'
    }
  }

  return {
    supported: true,
    reason: 'wallet_detected',
    wallet: wallet.name,
    message: `已检测到 ${wallet.name}`
  }
}

function isMiniProgram() {
  try {
    return typeof window.wx !== 'undefined' && typeof window.wx.miniProgram !== 'undefined'
  } catch {
    return false
  }
}

function detectWallet() {
  if (typeof window === 'undefined') {
    return { detected: false, name: null }
  }

  if (window.ethereum?.isMetaMask) {
    return { detected: true, name: 'MetaMask' }
  }

  if (window.coinbaseWalletExtension) {
    return { detected: true, name: 'Coinbase Wallet' }
  }

  if (window.bitkeep && window.bitkeep.ethereum) {
    return { detected: true, name: 'BitKeep' }
  }

  if (window.trust) {
    return { detected: true, name: 'Trust Wallet' }
  }

  if (window.BinanceChain?.bnb) {
    return { detected: true, name: 'Binance Web3 Wallet' }
  }

  if (window.okexchain) {
    return { detected: true, name: 'OKX Wallet' }
  }

  if (typeof window.ethereum !== 'undefined') {
    return { detected: true, name: 'Web3 Wallet' }
  }

  if (window.web3?.currentProvider) {
    return { detected: true, name: 'Web3 Provider' }
  }

  return { detected: false, name: null }
}

export async function connectWallet() {
  const support = checkWeb3Support()
  if (!support.supported) {
    throw new Error(support.message)
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })
    return {
      address: accounts[0],
      wallet: support.wallet
    }
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('用户拒绝了连接请求')
    }
    throw error
  }
}

export function getCurrentAccount() {
  return new Promise((resolve, reject) => {
    if (!window.ethereum) {
      resolve(null)
      return
    }

    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        resolve(accounts.length > 0 ? accounts[0] : null)
      })
      .catch(reject)
  })
}

export function signMessage(message) {
  return new Promise(async (resolve, reject) => {
    if (!window.ethereum) {
      reject(new Error('未检测到钱包'))
      return
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length === 0) {
        reject(new Error('请先连接钱包'))
        return
      }
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, accounts[0]]
      })
      resolve(signature)
    } catch (error) {
      reject(error)
    }
  })
}

export function formatAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
