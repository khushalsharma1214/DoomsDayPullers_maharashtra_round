import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StadiumScene from "./components/StadiumScene";

gsap.registerPlugin(ScrollTrigger);

const matches = [
  {
    team1: "MI",
    team2: "CSK",
    name1: "Mumbai Indians",
    name2: "Chennai Super Kings",
    stadium: "Wankhede Stadium",
    city: "Mumbai",
    date: "12 OCTOBER",
    time: "7:30 PM",
    price: "999",
  },
  {
    team1: "RCB",
    team2: "RR",
    name1: "Royal Challengers",
    name2: "Rajasthan Royals",
    stadium: "M. Chinnaswamy Stadium",
    city: "Bengaluru",
    date: "15 OCTOBER",
    time: "7:30 PM",
    price: "799",
  },
];

function App() {

  const [selectedMatch, setSelectedMatch] =
    useState<(typeof matches)[0] | null>(null);

  const [faq, setFaq] = useState<number | null>(null);

  const [seconds, setSeconds] = useState(47);

  useEffect(() => {

    const interval = setInterval(() => {
      setSeconds((value) =>
        value <= 0 ? 47 : value - 1
      );
    }, 1000);

    return () => clearInterval(interval);

  }, []);

  useEffect(() => {

    const sections =
      document.querySelectorAll(".reveal");

    sections.forEach((section) => {

      gsap.fromTo(
        section,
        {
          opacity: 0,
          y: 100,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
          },
        }
      );

    });

    return () => {
      ScrollTrigger.getAll().forEach(
        (trigger) => trigger.kill()
      );
    };

  }, []);

  return (
    <div className="crictix">

      {/* =================================
          FIXED 3D WORLD
      ================================= */}

      <div className="world">

        <Canvas
          camera={{
            position: [0, 4, 15],
            fov: 45,
          }}
          dpr={[1, 1.7]}
          gl={{
            antialias: true,
          }}
        >

          <StadiumScene />

        </Canvas>

      </div>


      {/* =================================
          NAVBAR
      ================================= */}

      <nav className="navbar">

        <div className="logo">

          <div className="logo-ball">
            🏏
          </div>

          <div>

            <strong>
              CRIC<span>TIX</span>
            </strong>

            <small>
              LIVE THE GAME
            </small>

          </div>

        </div>

        <div className="nav-links">

          <a href="#matches">
            MATCHES
          </a>

          <a href="#experience">
            EXPERIENCE
          </a>

          <a href="#tickets">
            TICKETS
          </a>

          <a href="#faq">
            FAQ
          </a>

        </div>

        <button className="nav-ticket">
          MY TICKETS
        </button>

      </nav>


      {/* =================================
          HERO
      ================================= */}

      <section className="hero">

        <div className="hero-copy">

          <p className="eyebrow">
            THE STADIUM IS WAITING
          </p>

          <h1>
            DON'T WATCH.
            <br />

            <span>
              LIVE IT.
            </span>
          </h1>

          <p className="hero-description">
            The roar. The lights. The final ball.
            <br />
            Your seat is waiting.
          </p>

          <div className="hero-actions">

            <a
              href="#matches"
              className="primary-button"
            >
              ENTER THE GAME
              <span>↗</span>
            </a>

            <a
              href="#experience"
              className="ghost-button"
            >
              DISCOVER CRICTIX
            </a>

          </div>

        </div>

        <div className="scroll-prompt">

          <span>
            SCROLL TO ENTER
          </span>

          <div />

        </div>

      </section>


      {/* =================================
          TRANSITION
      ================================= */}

      <section className="transition-section">

        <div className="transition-text">

          <span>
            THE GAME
          </span>

          <strong>
            IS HERE.
          </strong>

        </div>

      </section>


      {/* =================================
          COUNTDOWN
      ================================= */}

      <section className="countdown-section reveal">

        <p className="eyebrow">
          NEXT BIG FIXTURE
        </p>

        <h2>
          MI <span>VS</span> CSK
        </h2>

        <p className="location">
          WANKHEDE STADIUM · MUMBAI
        </p>

        <div className="countdown">

          <div>
            <strong>09</strong>
            <span>DAYS</span>
          </div>

          <div>
            <strong>18</strong>
            <span>HOURS</span>
          </div>

          <div>
            <strong>42</strong>
            <span>MINUTES</span>
          </div>

          <div>
            <strong>
              {String(seconds).padStart(2, "0")}
            </strong>
            <span>SECONDS</span>
          </div>

        </div>

      </section>


      {/* =================================
          MATCHES
      ================================= */}

      <section
        id="matches"
        className="matches-section"
      >

        <div className="section-heading reveal">

          <p className="eyebrow">
            THE FIXTURES
          </p>

          <h2>
            CHOOSE
            <br />
            YOUR GAME.
          </h2>

          <p>
            The biggest rivalries.
            <br />
            One seat away.
          </p>

        </div>


        <div className="match-grid">

          {matches.map((match, index) => (

            <div
              className="match-card reveal"
              key={index}
            >

              <div className="match-number">
                0{index + 1}
              </div>

              <div className="match-date">
                {match.date}
              </div>

              <div className="teams">

                <div>

                  <div className="team-logo blue">
                    {match.team1}
                  </div>

                  <h3>
                    {match.name1}
                  </h3>

                </div>

                <span className="vs">
                  VS
                </span>

                <div>

                  <div className="team-logo yellow">
                    {match.team2}
                  </div>

                  <h3>
                    {match.name2}
                  </h3>

                </div>

              </div>

              <div className="match-info">

                <span>
                  📍 {match.stadium}
                </span>

                <span>
                  {match.time}
                </span>

              </div>

              <div className="match-bottom">

                <div>

                  <small>
                    FROM
                  </small>

                  <strong>
                    ₹{match.price}
                  </strong>

                </div>

                <button
                  onClick={() =>
                    setSelectedMatch(match)
                  }
                >
                  SELECT SEAT →
                </button>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* =================================
          EXPERIENCE
      ================================= */}

      <section
        id="experience"
        className="experience-section"
      >

        <div className="experience-copy reveal">

          <p className="eyebrow">
            MORE THAN A TICKET
          </p>

          <h2>
            THE MATCH
            <br />
            STARTS
            <br />

            <span>
              HERE.
            </span>
          </h2>

        </div>

        <div className="experience-list">

          {[
            [
              "01",
              "CHOOSE YOUR VIEW",
              "Find the seat that gives you the perfect angle."
            ],
            [
              "02",
              "LOCK YOUR SEAT",
              "Secure your place before the crowd gets there."
            ],
            [
              "03",
              "LIVE THE MOMENT",
              "Walk through the gates and feel the stadium roar."
            ],
          ].map(([number, title, text]) => (

            <div
              className="experience-row reveal"
              key={number}
            >

              <span>
                {number}
              </span>

              <div>

                <h3>
                  {title}
                </h3>

                <p>
                  {text}
                </p>

              </div>

              <b>
                ↗
              </b>

            </div>

          ))}

        </div>

      </section>


      {/* =================================
          TICKET TIERS
      ================================= */}

      <section
        id="tickets"
        className="tickets-section"
      >

        <div className="section-heading centered reveal">

          <p className="eyebrow">
            FIND YOUR VIEW
          </p>

          <h2>
            YOUR
            <br />
            SEAT.
            <span>
              YOUR
            </span>
            <br />
            STORY.
          </h2>

        </div>


        <div className="ticket-grid">

          {[
            [
              "STANDARD",
              "₹999",
              "Great atmosphere",
              "Upper stand"
            ],
            [
              "PREMIUM",
              "₹1,499",
              "Closer to the action",
              "Premium stand"
            ],
            [
              "VIP",
              "₹2,499",
              "The ultimate view",
              "Hospitality lounge"
            ],
          ].map(
            ([name, price, description, place], index) => (

              <div
                className={`tier tier-${index}`}
                key={name}
              >

                <span className="tier-number">
                  0{index + 1}
                </span>

                <p>
                  {name}
                </p>

                <strong>
                  {price}
                </strong>

                <div>
                  <span>
                    {description}
                  </span>

                  <span>
                    {place}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setSelectedMatch(matches[0])
                  }
                >
                  CHOOSE
                </button>

              </div>

            )
          )}

        </div>

      </section>


      {/* =================================
          FAQ
      ================================= */}

      <section
        id="faq"
        className="faq-section"
      >

        <div className="faq-title reveal">

          <p className="eyebrow">
            FREQUENTLY ASKED
          </p>

          <h2>
            QUESTIONS
          </h2>

          <p>
            TAP ANY RECORD TO
            <br />
            REVEAL DETAILS.
          </p>

        </div>


        <div className="faq-list">

          {[
            [
              "HOW DO I BOOK?",
              "Choose a match, select your seats and complete checkout. Your digital ticket will be generated after confirmation."
            ],
            [
              "CAN I CHOOSE MY SEAT?",
              "Yes. CricTix provides an interactive seat-selection experience with different ticket tiers."
            ],
            [
              "CAN I CANCEL MY TICKET?",
              "Cancellation and refund availability can be configured according to the event's ticket policy."
            ],
            [
              "DO I GET A DIGITAL TICKET?",
              "Yes. Your confirmed booking can generate a digital ticket containing your match, seat and booking details."
            ],
            [
              "HOW DOES THE STADIUM MAP WORK?",
              "Choose a section, explore available seats and select the view you prefer before continuing."
            ],
          ].map(([question, answer], index) => {

            const open = faq === index;

            return (

              <div
                className={`faq-item ${
                  open ? "open" : ""
                }`}
                key={question}
              >

                <button
                  onClick={() =>
                    setFaq(open ? null : index)
                  }
                >

                  <span>
                    0{index + 1}
                  </span>

                  <strong>
                    {question}
                  </strong>

                  <b>
                    {open ? "−" : "+"}
                  </b>

                </button>

                {open && (
                  <p>
                    {answer}
                  </p>
                )}

              </div>

            );

          })}

        </div>

      </section>


      {/* =================================
          FINAL CTA
      ================================= */}

      <section className="final-section">

        <p className="eyebrow">
          YOUR SEAT IS WAITING
        </p>

        <h2>
          SEE YOU
          <br />
          <span>
            AT THE GAME.
          </span>
        </h2>

        <button
          onClick={() =>
            setSelectedMatch(matches[0])
          }
          className="primary-button large"
        >
          GET YOUR TICKET
          <span>↗</span>
        </button>

      </section>


      {/* =================================
          FOOTER
      ================================= */}

      <footer>

        <div className="footer-logo">
          CRIC<span>TIX</span>
        </div>

        <p>
          LIVE THE GAME.
        </p>

        <span>
          © 2026 CRICTIX
        </span>

      </footer>


      {/* =================================
          BOOKING MODAL
      ================================= */}

      {selectedMatch && (

        <div className="booking-overlay">

          <div className="booking-modal">

            <button
              className="close"
              onClick={() =>
                setSelectedMatch(null)
              }
            >
              ×
            </button>

            <p className="eyebrow">
              SELECT YOUR SEAT
            </p>

            <h2>
              {selectedMatch.team1}
              {" "}
              <span>VS</span>
              {" "}
              {selectedMatch.team2}
            </h2>

            <p className="modal-location">
              {selectedMatch.stadium}
              {" · "}
              {selectedMatch.date}
            </p>

            <div className="pitch">
              PITCH
            </div>

            <div className="seat-map">

              {Array.from({
                length: 36,
              }).map((_, index) => (

                <button
                  key={index}
                  className={
                    index === 4 ||
                    index === 10 ||
                    index === 17 ||
                    index === 25
                      ? "booked"
                      : ""
                  }
                >
                  {index + 1}
                </button>

              ))}

            </div>

            <div className="booking-bottom">

              <div>

                <small>
                  STARTING FROM
                </small>

                <strong>
                  ₹{selectedMatch.price}
                </strong>

              </div>

              <button
                onClick={() =>
                  setSelectedMatch(null)
                }
              >
                CONTINUE →
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;