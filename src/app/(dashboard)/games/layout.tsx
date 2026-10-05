import React from 'react'
import GameSocketIoProvider from '@/context/GameSocketIoContext';



const Layout = async(props: any) => {
  return (
    <React.Fragment>  
      <GameSocketIoProvider>
          {props.children}
      </GameSocketIoProvider>
      </React.Fragment>
  )
}

export default Layout
