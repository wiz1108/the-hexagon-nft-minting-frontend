import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components'
import Hamburger from 'hamburger-react'
import MetaMaskOnboarding from '@metamask/onboarding';
import './header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDiscord } from '@fortawesome/free-brands-svg-icons'
import { faTwitter } from '@fortawesome/free-brands-svg-icons'
import Web3 from 'web3'
import { CHAINID } from '../../constants/'

import { initWallet } from '../../utils/web3/Wallet'
import { faUser } from '@fortawesome/free-regular-svg-icons'

import {
	connectAccount,
	onLogout,
	setShowWrongChainModal,
	chainConnect,
} from '../../GlobalState/User';

const CatalogStyle = styled.div`{
  .dropdown-menu {
    background:linear-gradient(180deg, #424242 0%, #323232 100%);
  }
  .btn-success {
    background:transparent !important;
    border:none !important;
  }
  @media(min-width:1350px) {
    .hamburger-react {
      display:none;
    }
  }
  @media (max-width:1350px) {
      .hamburger-react {
        position: fixed !important;
        right: 0;
        top: 0;
        margin-right:16px;
        margin-top:16px;
        // background:green;
        z-index:10;
        opacity:0.7;
        border-radius:20px;
      }
      .btn-success {
        color:yellow !important;
        font-size:25px;
      }
    }
}`;

const Navigation = ({ wallet, connect, home, staking, billboard, logout }) => {
  return <div className="hamburger-menu" >
    <ul className="menu-box" id="menu_box">
      <li>
        <Link to='/' style={home}>Home</Link>
      </li>
      <li><Link to='staking' style={staking}>NFT Staking</Link><p>soon</p></li>
      <li><a href='#'>Marketplace</a><p>soon</p></li>
      <li><a href='#'>Farm</a><p>soon</p></li>
      <li><a href='#' style={billboard} >HoneyComb</a><img src='/images/open_in_new.png' /><p>soon</p></li>
      <li><a href='#'>Game</a><img src='/images/open_in_new.png' /><p>soon</p></li>
      <li><a href='https://whitepaper.thehexagonbee.com/' target='_blank'>Whitepaper<img src='/images/open_in_new.png' /></a></li>
      <li><a href='#footer' >Community</a></li>
      {/* <div className="menu-social">
        <a href='https://discord.gg/KKcsW7d7J4' target='_blank'><FontAwesomeIcon icon={faDiscord} /></a>
        <a href='https://twitter.com/TheHexagonOrg/' target='_blank'><FontAwesomeIcon icon={faTwitter} /></a>
      </div> */}
      {/* <li>
        <button className='metamask' onClick={() => connect()}>{!!wallet ? wallet.substr(0, 6) + '...' + wallet.substr(wallet.length - 4, 4) : 'Connect Wallet'}</button>
      </li> */}
      <li>
        <div className='burger-connect-wallet'>
          {/* <li className='wallet-li'><a><button className='burger-user-info'>
            <FontAwesomeIcon icon={faUser} /></button></a></li> */}
          <li>
            { !!wallet ? <button onClick={() => logout()} className="metamask">
              {wallet.substr(0, 6) + '...' + wallet.substr(wallet.length - 4, 4)}
              </button> : <button onClick={() => connect()} className="metamask">Connect</button>
            }
          </li>
        </div>
      </li>
    </ul>
  </div >
}

const Header = (props) => {
  const dispatch = useDispatch();

  const [isOpen, setOpen] = useState(false);
  const [number, setNumber] = useState(1)
  const [web3, setWeb3] = useState(null)
  const [remain, setRemain] = useState('2,000')
  const [price, setPrice] = useState('')

  const wallet = useSelector((state) => {
    return state.user.address;
  })

  const needsOnboard = useSelector((state) => {
		return state.user.needsOnboard;
	});

  const correctChain = useSelector((state) => {
		return state.user.correctChain;
	});

  useEffect(() => {
    if (!!wallet && !correctChain) {
      dispatch(chainConnect());
    }
  }, [correctChain, wallet])
  
  const connect = async () => {
    if (needsOnboard) {
      const onboarding = new MetaMaskOnboarding();
      onboarding.startOnboarding();
    } else {
      dispatch(connectAccount());
    }
  }

  const user = useSelector((state) => {
		return state.user;
	});

  const logout = async () => {
		dispatch(onLogout());
	}

  useEffect(() => {
    if (
      localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER') ||
      window.ethereum ||
      localStorage.getItem('DeFiLink_session_storage_extension')
    ) {
      if (!user.provider) {
        if (window.navigator.userAgent.includes("Crypto.com DeFiWallet")) {
          dispatch(connectAccount(false, "defi"));
        } else {
          dispatch(connectAccount());
        }
      }
    }
    if (!user.provider) {
      if (window.navigator.userAgent.includes("Crypto.com DeFiWallet")) {
        dispatch(connectAccount(false, "defi"));
      }
    }

    // eslint-disable-next-line
  }, []);

  return (
    <CatalogStyle className='header'>
      <div className="header-section">
        <div className="header-container">
          <div className="header-control">
            <div className='image-group'>
              <a href='/' >
                <img src='/images/logo.png' className='logo' />
                <img src='/images/logotext.png' className='logotext' /></a>
            </div>
            <div className="header-menu">
              <ul>
                <li>
                  <a href='/' style={props.home}>Home</a>
                </li>
                <li><p>soon</p><a href='#' style={props.staking} >NFT Staking</a></li>
                <li><p>soon</p><a href='#'>Marketplace</a></li>
                <li><p>soon</p><a href='#'>Farm</a></li>
                <li><p>soon</p><a href='#' style={props.billboard}>HoneyComb<img src='/images/open_in_new.png' /></a></li>
                <li><p>soon</p><a href='#'>Game<img src='/images/open_in_new.png' /></a></li>
                <li><a href='https://whitepaper.thehexagonbee.com/' target='_blank'>Whitepaper<img src='/images/open_in_new.png' /></a></li>
                <li><a href='#footer'>Community</a></li>
              </ul>
              {/* <div className="header-social">
                <a href='https://discord.gg/KKcsW7d7J4' target='_blank'><FontAwesomeIcon icon={faDiscord} /></a>
                <a href='https://twitter.com/TheHexagonOrg/' target='_blank'><FontAwesomeIcon icon={faTwitter} /></a>
              </div> */}
              {/* <a><button className='metamask'><span>Connect</span></button></a> */}
              <div className='connect-wallet'>
                {/* <li><a><button className='user-info'>
                  <FontAwesomeIcon icon={faUser} /></button></a></li> */}
                <li>
                  { !!wallet ? <button onClick={() => logout()} className="metamask">
                    {wallet.substr(0, 6) + '...' + wallet.substr(wallet.length - 4, 4)}
                    </button> : <button onClick={() => connect()} className="metamask">Connect</button>
                  }
                </li>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isOpen && <Navigation wallet={wallet} connect={connect} logout={logout}/>}
      <Hamburger toggled={isOpen} toggle={setOpen} color='#fff' />
    </CatalogStyle>
  );
}
export default Header;
