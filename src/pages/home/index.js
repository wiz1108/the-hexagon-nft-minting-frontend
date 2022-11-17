import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from "react-toastify"
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Typography } from '@mui/material';
import BigNumber from 'bignumber.js'

import Web3 from 'web3';
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { web3Modal } from "../../utils/web3/Wallet";

import { errorAlert, warningAlert } from '../../components/toastGroup';
import { ethers } from "ethers";
import config from '../../constants/contractConfig';
import NFTABI from '../../constants/abiNFT.json';

import Header from '../../components/header'
import Footer from '../../components/footer'
import Banner from './banner'
import About from './about'
import Story from './story'
import Roadmap from './roadmap'
import Tokens from './tokens'
import Faq from './faq'
import Scrolltotop from '../../components/scrolltotop'
import './home.css';
import { connectingWallet } from '../../GlobalState/User';

const MintAlert = withReactContent(Swal);

const errors = [
 /*0*/ "The wrong network, please switch to the Avalanche network.",
 /*1*/  "First, you should connect it with your wallet.",
 /*2*/  "Mint limit exceed!",
 /*3*/  "SALE has not Started!",
 /*4*/  "Amount Exceed!",
 /*5*/  "Amount Exceed! No more than 1700 NFTs are provided during the pre-sale stage.",
 /*6*/  "You are not a WhiteListed Person! In the pre-sale stage, only owners in the WhiteListed can get.",
 /*7*/  "In PRESALE Stage, you can buy ONLY 2 Cronos!",
 /*8*/  "Your balance is not enough.",
 /*9*/  "You can buy a maximum of 8 Cronos.",
/*10*/  "Oops. We find the unknown error. Please try again.",
/*11*/  "Oops. Insufficient funds.",
]

const pricesChunk = [
  { number: 999, price: 0.6 },
  { number: 1999, price: 0.8 },
  { number: 2999, price: 1 },
  { number: 3999, price: 1.2 },
  { number: 6999, price: 1.5 },
  { number: 10000, price: 2 }
]

const readProvider = new ethers.providers.JsonRpcProvider(config.read_rpc);

const Home = () => {
  const dispatch = useDispatch();

  const [input, setInput] = useState(1);
  const [count, setCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0)
  const [availableNum, setAvaiableNum] = useState(10000);
  const [isOnPresale, setIsOnPresale] = useState(false);
  const [isOnPublicSale, setIsOnPublicSale] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddress, setShowAddress] = useState("Connect Wallet");
  const toggle = () => setIsOpen(!isOpen);

  const nftContract = useSelector((state) => {
    return state.user.nftContract;
  });

  const walletBalance = useSelector((state) => {
    return state.user.balance;
  });

  const walletAddress = useSelector((state) => {
    return state.user.address;
  });

  useEffect(() => {
    getTotalMinted()
  }, []);

  const useInterval = (callback, delay) => {
    const savedCallback = useRef()

    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback
    }, [callback])

    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current()
      }
      if (delay !== null) {
        let id = setInterval(tick, delay)
        return () => clearInterval(id)
      }
    }, [delay])
  }

  const getTotalMinted = () => {
    console.log('getTotalminted', config.nft_contract, NFTABI, readProvider)
    let nft_read_contract = new ethers.Contract(config.nft_contract, NFTABI, readProvider)
    nft_read_contract
      .minted()
      .then(minted => {
        console.log('minted: ', minted)
        setTotalMinted(minted.toNumber())
      });
  }

  // useInterval(() => getTotalMinted(), 5000)

  const getTotalPrice = mintAmount => {
    let totalPrice = 0;
    for (let i = 1; i <= mintAmount; i++) {
      let priceList = pricesChunk.filter(priceItem => totalMinted + i <= priceItem.number)
      let onlyPriceList = []
      priceList.map(item => {
        onlyPriceList.push(item.price)
      })
      totalPrice += Math.min(...onlyPriceList)
    }
    console.log('total price', totalPrice)
    return totalPrice
  }

  const _mint = async () => {
    if (!walletAddress) {
      errorAlert(errors[1]);
      return
    }

    // console.log('aaa: ', walletAddress, nftContract)

    dispatch(connectingWallet({ connecting: true }));
    const price = getTotalPrice(count)
    console.log("minting price is :", price.toString())
    toast.dismiss();

    try {
      if (price > walletBalance) {
        errorAlert(errors[11]);
        dispatch(connectingWallet({ connecting: false }));
        return;
      }
      const extra = {
        value: ethers.utils.parseEther(price.toString())
      }
      let txhandle = await nftContract.mint([], count, extra);
      await txhandle.wait();
      MintAlert.fire({
        title: 'Congratulation!',
        html: 'Minting Sucess',
        icon: 'success'
      })
    } catch (err) {
      dispatch(connectingWallet({ connecting: true }));
      if (err < 10) {
        errorAlert(errors[err]);
      } else if (err === 11) {
      } else {
        errorAlert(errors[10]);
        console.log(err);
      }
    }
    dispatch(connectingWallet({ connecting: true }));
  }

  return (
    <div className="Home-container">
      <Header home={{ color: '#e4ae46' }} address={walletAddress} />
      <Banner
        mint=
        {
          () => {
            _mint()
          }
        }
        isLoading={isLoading}
        count={count}
        setCount={setCount}
        totalMinted={totalMinted}
        availableNum={availableNum}
      />
      <About />
      <Story />
      <Roadmap />
      <Tokens />
      <Faq />
      <Footer />
      <Scrolltotop />
      <ToastContainer style={{ fontSize: 12, padding: "5px !important", lineHeight: "15px" }} />
    </div>
  );
}
export default Home;
