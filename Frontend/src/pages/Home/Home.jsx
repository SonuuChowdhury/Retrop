import React from 'react'
import Navbar from '../../components/Navbar/Navbar.jsx'
import Hero from '../../components/Hero/Hero.jsx'
import SignatureDishes from '../../components/SignatureDishes/SignatureDishes.jsx'
import Hours from '../../components/Hours/Hours.jsx'
import Location from '../../components/Location/Location.jsx'
import Contact from '../../components/Contact/Contact.jsx'
import OrderOnline from '../../components/OrderOnline/OrderOnline.jsx'
import Footer from '../../components/Footer/Footer.jsx'
import './Home.css'

export default function Home({ data }) {
  const { branding, contact, location, reviews, hours, orderOnline, signatureDishes } = data

  return (
    <div className="home-page">
      <Navbar branding={branding} />

      <main id="main-content">
        <Hero branding={branding} reviews={reviews} />
        <SignatureDishes dishes={signatureDishes} />
        <Hours hours={hours} />
        <Location location={location} contact={contact} />
        <OrderOnline orderOnline={orderOnline} />
        <Contact contact={contact} reviews={reviews} />
      </main>

      <Footer branding={branding} contact={contact} />
    </div>
  )
}