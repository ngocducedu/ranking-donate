import 'regenerator-runtime/runtime'
import React, {useEffect, useState} from 'react'
import { login, logout } from './utils'
import { utils, transactions } from "near-api-js";
import './global.css'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')

export default function App() {
  
  // use React Hooks to store greeting in component state
  const [greeting, set_greeting] = React.useState()
  const [donate, setDonate] = React.useState(0);
  const [leaderboard, setLeaderboar] = React.useState([]);

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html

  useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {

        // window.contract is set by initContract in index.js
        window.contract.get_leaderboard_donate({ account_id: window.accountId })
          .then(obj => {
            let sorted = obj.sort(function (a, b) {
              return  b.donate - a.donate ;
            });
            setLeaderboar(sorted)
          })
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )

  useEffect(
    () => {
      let sorted = leaderboard.sort(function (a, b) {
        return  parseInt(b.donate) - parseInt(a.donate) ;
      });
      setLeaderboar(sorted)

    },
    [leaderboard]
  )

  
  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1>Welcome to NEAR!</h1>
        <p class="mt-4 mb-8 mx-auto text-center text-indigo-600"><strong>HINT! "donate more to get higher ranking"</strong> </p>

        <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    )
  }


  return (
    
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <button className="link" style={{ float: 'right' }} onClick={logout}>
        Sign out
      </button>
      <main>
        <h1>
          <label
            htmlFor="greeting"
            style={{
              color: 'var(--secondary)',
              borderBottom: '2px solid var(--secondary)'
            }}
          >
            {greeting}
          </label>
          {' '/* React trims whitespace around tags; insert literal space character when needed */}
          {window.accountId}!
        </h1>
        <form onSubmit={async event => {
          event.preventDefault()

          // get elements from the form using their id attribute
          const { fieldset, greeting } = event.target.elements

          // hold onto new user-entered value from React's SynthenticEvent for use after `await` call
          const newGreeting = greeting.value

          // disable the form while the value gets updated on-chain
          fieldset.disabled = true

          try {
            // make an update call to the smart contract
            await window.contract.add_mess_and_donate({
              // pass the value that the user entered in the greeting field
              message: newGreeting
            },
            300000000000000,
            utils.format.parseNearAmount(donate.toString())
            )
            
          } catch (e) {
            alert(
              'Something went wrong! ' +
              'Maybe you need to sign out and back in? ' +
              'Check your browser console for more info.'
            )
            throw e
          } finally {
            // re-enable the form, whether the call succeeded or failed
            fieldset.disabled = false
          }

          // update local `greeting` variable to match persisted value
          set_greeting(newGreeting)

          // show Notification
          setShowNotification(true)

          // remove Notification again after css animation completes
          // this allows it to be shown again next time the form is submitted
          setTimeout(() => {
            setShowNotification(false)
          }, 11000)
        }}>
          {leaderboard.filter(obj => obj.owner_id == window.accountId)[0] && <p class="mt-4 mb-8 mx-auto text-center text-indigo-600"><strong>Hello,{leaderboard.filter(obj => obj.owner_id == window.accountId)[0].mess} “How are you today?” <br/> <br/>You know, "donations more , get the higher the ratings"</strong> </p>}
          <fieldset id="fieldset">
            <label
              htmlFor="greeting"
              style={{
                display: 'block',
                color: 'var(--gray)',
                marginBottom: '0.5em'
              }}
            >
              Enter your name:
            </label>
            <div style={{ display: 'flex' }} class="highlight">
              <input
                autoComplete="off"
                defaultValue={greeting}
                id="greeting"
                onChange={e => setButtonDisabled(e.target.value === greeting)}
                style={{ flex: 1 }}
              />
            </div>
            <div>
              <label for="donation">Donation (optional):</label>
              <input
                placeholder={"0.0"}
                min="0"
                step="0.01"
                type={"number"} 
                autoComplete="off"
                id="donation"
                onChange={e => setDonate(e.target.value)}
                style={{ flex: 1 }}
              />
              <span title="NEAR Tokens">Ⓝ</span>
              <div style={{display:'flex', alignItems: 'center' }}>
                <img src="https://www.clipartmax.com/png/full/187-1872187_graphic-of-hand-putting-money-in-a-donation-box-donate-icon-red.png" class="img-donate"/>
                <p >Cumulative when donating multiple times:</p>
              </div>  
              
            </div>
            
            <button
                disabled={buttonDisabled}
                style={{ borderRadius: '5px 5px 5px 0' }}
              >
                Send
            </button>
          </fieldset>
          
        </form>
        <h2>
          Top Rank Donation
        </h2>
        <ol>
          {console.log(leaderboard)}
          {leaderboard.map((obj,index) => (
            
            <li key={index} class={index<3 ? "is-premium" : "no-premium"}>
              
              <div>
                <span>
                  <strong>{obj.owner_id}</strong>
                  {index<3 ? <img src="https://e7.pngegg.com/pngimages/486/307/png-clipart-rank-medal-medal-hd-pn-chart-ribbon-medal.png" class="img-premium"/> : <p></p>}
                </span>
                <span class="time-right">{new Date(obj.time/1000000).toLocaleString()}</span>
              </div>
              <div>
                Hello: {obj.mess}
              </div>
              <div>
                Total Donation: {Number((obj.donate/(10**24)).toFixed(2)) } Ⓝ
               </div>
            </li>
          ))}
        </ol>
        <hr />
        
      </main>
      {showNotification && <Notification />}
    </>
  )
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'set_greeting' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}
