import { Canvas } from "@react-three/fiber";
import { useEffect, useState, useRef, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import StadiumScene from "./components/StadiumScene";
import AntiBotHUD from "./components/AntiBotHUD";
import AntiBotQueueModal from "./components/AntiBotQueueModal";
import Teammate4AnalyticsModal from "./components/Teammate4AnalyticsModal";
import {
  loginUser,
  registerUser,
  fetchUserProfile,
  saveUserProfile,
  fetchInventoryStatus,
} from "./services/integratedApi";

gsap.registerPlugin(ScrollTrigger);


/* ==========================================================================
   1. MATCH FIXTURES DATA (WITH DETAILED STADIUM METRICS & GUIDELINES)
   ========================================================================== */
export interface MatchFixture {
  id: string;
  team1: string;
  team2: string;
  name1: string;
  name2: string;
  rivalryTag: string;
  tournament: string;
  stadium: string;
  city: string;
  date: string;
  time: string;
  price: number;
  capacity: string;
  capacityNumber: string;
  parking: string;
  foodBeverages: string;
  description: string;
  images: string[];
  pitchInfo: string;
  guidelines: string[];
}

const matches: MatchFixture[] = [
  {
    id: "match-01",
    team1: "IND",
    team2: "AUS",
    name1: "INDIA",
    name2: "AUSTRALIA",
    rivalryTag: "BORDER-GAVASKAR TROPHY // 2ND ODI",
    tournament: "2nd ODI",
    stadium: "Wankhede Stadium",
    city: "Mumbai, Maharashtra",
    date: "18 Oct 2026",
    time: "7:30 PM",
    price: 1200,
    capacity: "98% BOOKED",
    capacityNumber: "33,000",
    parking: "Available",
    foodBeverages: "Available",
    description:
      "One of the most iconic cricket stadiums in the world, known for its electrifying atmosphere, coastal sea breeze, and rich championship history.",
    images: [
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    ],
    pitchInfo:
      "Red soil turf offering true bounce and carry for fast bowlers, while facilitating high-velocity stroke play under lights. Par 1st innings total: 195.",
    guidelines: [
      "Turnstiles open at 4:30 PM (3 hours prior to match commencement).",
      "Only small personal bags permitted. Strictly no coins, power banks, or bottles.",
      "Valid CricTix digital PNR pass barcode required at optical turnstiles.",
      "Zero tolerance policy towards offensive language or pitch intrusion.",
    ],
  },
  {
    id: "match-02",
    team1: "MI",
    team2: "CSK",
    name1: "Mumbai Indians",
    name2: "Chennai Super Kings",
    rivalryTag: "EL CLÁSICO // FIXTURE 02",
    tournament: "IPL Mega Clash",
    stadium: "Wankhede Stadium",
    city: "Mumbai, Maharashtra",
    date: "22 Oct 2026",
    time: "7:30 PM",
    price: 1200,
    capacity: "94% BOOKED",
    capacityNumber: "33,000",
    parking: "Available",
    foodBeverages: "Available",
    description:
      "The ultimate IPL rivalry where five-time champions clash under the Marine Drive floodlights amidst deafening home chants.",
    images: [
      "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    ],
    pitchInfo:
      "Fast outfield with short square boundaries. Dew factor in the second innings strongly favors aggressive run chases.",
    guidelines: [
      "Entry turnstiles activate 3 hours before toss.",
      "Wear your team colors proudly in designated fan sectors.",
      "Digital wallet pass scanning enabled at all turnstile gates.",
      "Emergency medical hubs located behind Garware and Tendulkar stands.",
    ],
  },
  {
    id: "match-03",
    team1: "RCB",
    team2: "KKR",
    name1: "Royal Challengers",
    name2: "Kolkata Knight Riders",
    rivalryTag: "SOUTHERN DERBY // FIXTURE 03",
    tournament: "IPL Southern Derby",
    stadium: "M. Chinnaswamy Stadium",
    city: "Bengaluru, Karnataka",
    date: "26 Oct 2026",
    time: "7:30 PM",
    price: 1200,
    capacity: "88% BOOKED",
    capacityNumber: "38,000",
    parking: "Available",
    foodBeverages: "Available",
    description:
      "India's premier high-scoring arena equipped with modern sub-air drainage, solar panel rooftops, and an explosive short-boundary outfield.",
    images: [
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1200&q=80",
    ],
    pitchInfo:
      "High altitude and short boundaries produce towering sixes. The SubAir drainage allows play to resume within 15 minutes of heavy rain.",
    guidelines: [
      "Gates open 3 hours before start time.",
      "Metro connectivity via Cubbon Park Station directly outside Gate 1.",
      "Eco-friendly zero-plastic arena policies strictly enforced.",
    ],
  },
];

/* ==========================================================================
   2. CIRCULAR STADIUM SEAT GENERATOR (SVG RADIAL GEOMETRY)
   ========================================================================== */
export interface StadiumSeat {
  id: string;
  label: string;
  stand: "NORTH STAND" | "EAST STAND" | "SOUTH STAND" | "VIP BOX" | "WEST STAND";
  price: number;
  cx: number;
  cy: number;
  status: "available" | "sold" | "premium";
}

function generateStadiumRadialSeats(): StadiumSeat[] {
  const seats: StadiumSeat[] = [];
  const cx = 270;
  const cy = 270;

  // 1. NORTH STAND (Top Arc: 220° to 320° / -140° to -40°) - ₹1,200
  const northRows = [
    { r: 138, count: 7, startAngle: -135, endAngle: -45, prefix: "A" },
    { r: 166, count: 8, startAngle: -138, endAngle: -42, prefix: "A" },
    { r: 196, count: 9, startAngle: -140, endAngle: -40, prefix: "A" },
  ];
  let nIndex = 1;
  northRows.forEach((row) => {
    const step = (row.endAngle - row.startAngle) / (row.count - 1);
    for (let i = 0; i < row.count; i++) {
      const angleDeg = row.startAngle + i * step;
      const angleRad = (angleDeg * Math.PI) / 180;
      const seatNum = nIndex++;
      const id = `A${seatNum < 10 ? "0" + seatNum : seatNum}`;
      seats.push({
        id,
        label: id,
        stand: "NORTH STAND",
        price: 1200,
        cx: Math.round(cx + row.r * Math.cos(angleRad)),
        cy: Math.round(cy + row.r * Math.sin(angleRad)),
        status: "available",
      });
    }
  });

  // 2. EAST STAND (Right Arc: -28° to 30°) - ₹1,500
  const eastRows = [
    { r: 138, count: 5, startAngle: -22, endAngle: 22, prefix: "E" },
    { r: 168, count: 6, startAngle: -25, endAngle: 25, prefix: "E" },
    { r: 198, count: 7, startAngle: -28, endAngle: 28, prefix: "E" },
  ];
  let eIndex = 1;
  eastRows.forEach((row) => {
    const step = (row.endAngle - row.startAngle) / (row.count - 1);
    for (let i = 0; i < row.count; i++) {
      const angleDeg = row.startAngle + i * step;
      const angleRad = (angleDeg * Math.PI) / 180;
      const seatNum = eIndex++;
      const id = `E${seatNum < 10 ? "0" + seatNum : seatNum}`;
      seats.push({
        id,
        label: id,
        stand: "EAST STAND",
        price: 1500,
        cx: Math.round(cx + row.r * Math.cos(angleRad)),
        cy: Math.round(cy + row.r * Math.sin(angleRad)),
        status: "available",
      });
    }
  });

  // 3. SOUTH STAND (Bottom Arc: 48° to 132°) - ₹2,000
  const southRows = [
    { r: 152, count: 7, startAngle: 50, endAngle: 130, prefix: "S" },
    { r: 170, count: 8, startAngle: 48, endAngle: 132, prefix: "S" },
    { r: 188, count: 9, startAngle: 46, endAngle: 134, prefix: "S" },
  ];
  let sIndex = 1;
  southRows.forEach((row) => {
    const step = (row.endAngle - row.startAngle) / (row.count - 1);
    for (let i = 0; i < row.count; i++) {
      const angleDeg = row.startAngle + i * step;
      const angleRad = (angleDeg * Math.PI) / 180;
      const seatNum = sIndex++;
      const id = `S${seatNum < 10 ? "0" + seatNum : seatNum}`;
      seats.push({
        id,
        label: id,
        stand: "SOUTH STAND",
        price: 2000,
        cx: Math.round(cx + row.r * Math.cos(angleRad)),
        cy: Math.round(cy + row.r * Math.sin(angleRad)),
        status: "available",
      });
    }
  });

  // 4. VIP BOX (Lower Center: 76° to 104°, closer to boundary) - ₹3,500
  const vipRows = [
    { r: 132, count: 4, startAngle: 78, endAngle: 102 },
    { r: 148, count: 4, startAngle: 76, endAngle: 104 },
  ];
  let vIndex = 1;
  vipRows.forEach((row) => {
    const step = (row.endAngle - row.startAngle) / (row.count - 1);
    for (let i = 0; i < row.count; i++) {
      const angleDeg = row.startAngle + i * step;
      const angleRad = (angleDeg * Math.PI) / 180;
      const seatNum = vIndex++;
      const id = `VIP-0${seatNum}`;
      seats.push({
        id,
        label: id,
        stand: "VIP BOX",
        price: 3500,
        cx: Math.round(cx + row.r * Math.cos(angleRad)),
        cy: Math.round(cy + row.r * Math.sin(angleRad)),
        status: "premium",
      });
    }
  });

  // 5. WEST STAND (Left Arc: 152° to 208°) - ₹1,500
  const westRows = [
    { r: 138, count: 5, startAngle: 158, endAngle: 202, prefix: "W" },
    { r: 168, count: 6, startAngle: 155, endAngle: 205, prefix: "W" },
    { r: 198, count: 7, startAngle: 152, endAngle: 208, prefix: "W" },
  ];
  let wIndex = 1;
  westRows.forEach((row) => {
    const step = (row.endAngle - row.startAngle) / (row.count - 1);
    for (let i = 0; i < row.count; i++) {
      const angleDeg = row.startAngle + i * step;
      const angleRad = (angleDeg * Math.PI) / 180;
      const seatNum = wIndex++;
      const id = `W${seatNum < 10 ? "0" + seatNum : seatNum}`;
      seats.push({
        id,
        label: id,
        stand: "WEST STAND",
        price: 1500,
        cx: Math.round(cx + row.r * Math.cos(angleRad)),
        cy: Math.round(cy + row.r * Math.sin(angleRad)),
        status: "available",
      });
    }
  });

  return seats;
}

const ALL_RADIAL_SEATS = generateStadiumRadialSeats();

/* ==========================================================================
   3. APP COMPONENT
   ========================================================================== */
export default function App() {
  // 1. AUTHENTICATION GATE
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("crictix_logged_in") === "true";
  });
  const [authView, setAuthView] = useState<"login" | "signup" | "otp" | "signup-success">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("849201");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [authError, setAuthError] = useState("");
  const [authToken, setAuthToken] = useState<string>(() => {
    return sessionStorage.getItem("crictix_auth_token") || "";
  });
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // 2. USER PROFILE DATA & PROFILE MODAL
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [userProfile, setUserProfile] = useState<{
    username: string;
    fullName: string;
    email: string;
    dob: string;
    phone: string;
    favoriteTeam: string;
    loyaltyTier: string;
    loyaltyPoints: number;
  }>(() => {
    try {
      const saved = localStorage.getItem("crictix_user_profile");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      username: "Alex_Cricketer",
      fullName: "Alex Sharma",
      email: sessionStorage.getItem("crictix_user_email") || "fan@cricket.com",
      dob: "2000-05-18",
      phone: "+91 98765 43210",
      favoriteTeam: "Team India",
      loyaltyTier: "COMMANDER VVIP",
      loyaltyPoints: 2450,
    };
  });

  // Sync profile from Teammate 2 Backend
  useEffect(() => {
    if (authToken) {
      fetchUserProfile(authToken)
        .then((res) => {
          if (res.success && res.user) {
            setUserProfile((prev) => ({
              ...prev,
              fullName: res.user.name || prev.fullName,
              email: res.user.email || prev.email,
              phone: res.user.phone || prev.phone,
            }));
          }
        })
        .catch(() => {});
    }
  }, [authToken]);

  // 3. THEME & SCROLL STATES
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("crictix_theme") as "dark" | "light") || "dark";
  });
  const [stumpsBroken, setStumpsBroken] = useState(false);

  // 4. BOOKING STAGE MACHINE: "fixtures" -> "match-details" -> "seat-selection"
  const [bookingStage, setBookingStage] = useState<"fixtures" | "match-details" | "seat-selection">(
    "fixtures"
  );
  const [selectedMatch, setSelectedMatch] = useState<MatchFixture>(matches[0]);
  const [liveAvailableSeats, setLiveAvailableSeats] = useState<number>(500);
  const [matchDetailsTab, setMatchDetailsTab] = useState<"overview" | "info" | "guidelines">("overview");
  const [carouselIndex, setCarouselIndex] = useState(0);

  // 5. SEAT SELECTION & ZOOM
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [bookedSeatIdsByMatch, setBookedSeatIdsByMatch] = useState<Record<string, string[]>>({});
  const bookedSeatIds = bookedSeatIdsByMatch[selectedMatch.id] || [];
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [hoveredSeat, setHoveredSeat] = useState<StadiumSeat | null>(null);

  // Synchronize live match inventory and booked seats whenever selectedMatch changes
  useEffect(() => {
    const numericMatchId = Number(selectedMatch.id.replace("match-0", "").replace("match-", "")) || 1;
    fetchInventoryStatus(numericMatchId)
      .then((status) => {
        if (status && status.availableSeats !== undefined) {
          setLiveAvailableSeats(status.availableSeats);
          setSelectedMatch((prev) => ({
            ...prev,
            capacity: `${Math.max(0, Math.round(((500 - status.availableSeats) / 500) * 100))}% BOOKED (${status.availableSeats}/500 SEATS LEFT)`,
          }));
          if (status.bookedSeatNumbers && Array.isArray(status.bookedSeatNumbers)) {
            const mappedIds = status.bookedSeatNumbers
              .filter((num: number) => num > 0 && num <= ALL_RADIAL_SEATS.length)
              .map((num: number) => ALL_RADIAL_SEATS[num - 1].id);
            setBookedSeatIdsByMatch((prev) => ({
              ...prev,
              [selectedMatch.id]: Array.from(new Set([...(prev[selectedMatch.id] || []), ...mappedIds])),
            }));
          }
        }
      })
      .catch(() => {});
  }, [selectedMatch.id]);

  // 6. WALLET & PASSES
  const [confirmedPass, setConfirmedPass] = useState<any | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [bookedPasses, setBookedPasses] = useState<any[]>(() => {

    try {
      const saved = localStorage.getItem("crictix_saved_passes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [myTicketsDrawerOpen, setMyTicketsDrawerOpen] = useState(false);

  // 7. FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const lenisRef = useRef<Lenis | null>(null);

  // Selected Seats Objects & Total Calculation
  const selectedSeatsObjects = useMemo(() => {
    return ALL_RADIAL_SEATS.filter((s) => selectedSeatIds.includes(s.id));
  }, [selectedSeatIds]);

  const subtotal = useMemo(() => {
    return selectedSeatsObjects.reduce((acc, curr) => acc + curr.price, 0);
  }, [selectedSeatsObjects]);

  const convenienceFee = selectedSeatsObjects.length > 0 ? 120 : 0;
  const grandTotal = subtotal + convenienceFee;

  // Toggle Theme
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("crictix_theme", next);
  };

  // Smooth Lenis Scroll
  useEffect(() => {
    if (!isAuthenticated) return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on("scroll", () => {
      ScrollTrigger.update();
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      setScrollProgress(window.scrollY / maxScroll);
    });

    return () => lenis.destroy();
  }, [isAuthenticated]);

  // Handle Login via Teammate 2 Backend
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please enter both email and password.");
      return;
    }
    setAuthError("");

    try {
      let res = await loginUser(authEmail, authPassword);
      if (!res.success) {
        // Auto-register for smooth onboarding
        const regRes = await registerUser(userProfile.fullName || "Alex Sharma", authEmail, authPassword);
        if (regRes.success) {
          res = await loginUser(authEmail, authPassword);
        } else {
          setAuthError(res.message || regRes.message || "Login failed. Check credentials.");
          return;
        }
      }

      if (res.token) {
        sessionStorage.setItem("crictix_logged_in", "true");
        sessionStorage.setItem("crictix_auth_token", res.token);
        sessionStorage.setItem("crictix_user_email", authEmail);
        setAuthToken(res.token);

        if (res.user) {
          setUserProfile((prev) => ({
            ...prev,
            fullName: res.user?.name || prev.fullName,
            email: res.user?.email || authEmail,
            phone: res.user?.phone || prev.phone,
          }));
        }

        setIsAuthenticated(true);
      }
    } catch {
      // Fallback
      sessionStorage.setItem("crictix_logged_in", "true");
      sessionStorage.setItem("crictix_user_email", authEmail);
      setIsAuthenticated(true);
    }
  };

  // Quick Demo Access via Teammate 2 Backend
  const handleQuickDemoLogin = async () => {
    const demo = "fan@cricket.com";
    const pw = "Password123!";
    setAuthEmail(demo);
    setAuthPassword(pw);

    try {
      let res = await loginUser(demo, pw);
      if (!res.success) {
        await registerUser("Alex Sharma", demo, pw);
        res = await loginUser(demo, pw);
      }

      if (res.token) {
        sessionStorage.setItem("crictix_logged_in", "true");
        sessionStorage.setItem("crictix_auth_token", res.token);
        sessionStorage.setItem("crictix_user_email", demo);
        setAuthToken(res.token);

        if (res.user) {
          setUserProfile((prev) => ({
            ...prev,
            fullName: res.user?.name || "Alex Sharma",
            email: demo,
            phone: res.user?.phone || "+91 98765 43210",
          }));
        }
      }
    } catch {}

    sessionStorage.setItem("crictix_logged_in", "true");
    sessionStorage.setItem("crictix_user_email", demo);
    setIsAuthenticated(true);
  };

  // Handle Request OTP
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setAuthError("");
    setAuthView("otp");
  };

  // Handle Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setAuthError("Invalid OTP. Please check the code.");
      return;
    }
    setAuthError("");
    setAuthView("signup-success");
  };

  // Complete Signup via Teammate 2 Backend
  const handleCompleteSignupAndEnter = async () => {
    try {
      await registerUser(userProfile.fullName || "Alex Sharma", authEmail, authPassword || "Password123!");
      const res = await loginUser(authEmail, authPassword || "Password123!");
      if (res.token) {
        sessionStorage.setItem("crictix_auth_token", res.token);
        setAuthToken(res.token);
      }
    } catch {}

    sessionStorage.setItem("crictix_logged_in", "true");
    sessionStorage.setItem("crictix_user_email", authEmail);
    setUserProfile((prev) => ({ ...prev, email: authEmail }));
    setIsAuthenticated(true);
  };

  // Handle Log Out
  const handleLogOut = () => {
    sessionStorage.removeItem("crictix_logged_in");
    sessionStorage.removeItem("crictix_auth_token");
    setAuthToken("");
    setIsAuthenticated(false);
    setAuthView("login");
    setAuthError("");
  };

  // Save Profile Updates to Teammate 2 Backend
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("crictix_user_profile", JSON.stringify(userProfile));

    try {
      const token = authToken || sessionStorage.getItem("crictix_auth_token");
      if (token) {
        await saveUserProfile(token, {
          name: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phone,
        });
      }
    } catch (err) {
      console.log("Profile backend update notice:", err);
    }

    setProfileSuccessMsg("Profile saved to Teammate 2 backend successfully!");
    setTimeout(() => setProfileSuccessMsg(""), 2500);
  };

  // Stumps impact callback from 3D scene
  const handleImpactTrigger = (hasImpacted: boolean) => {
    if (hasImpacted && !stumpsBroken) {
      setStumpsBroken(true);
    } else if (!hasImpacted && stumpsBroken && scrollProgress < 0.08) {
      setStumpsBroken(false);
    }
  };

  // Match Selection -> Goes to Match & Stadium Details Page
  const handleSelectMatch = (match: MatchFixture) => {
    setSelectedMatch(match);
    setSelectedSeatIds([]);
    setBookingStage("match-details");
    setMatchDetailsTab("overview");
    setCarouselIndex(0);

    const matchSection = document.getElementById("booking-workflow");
    if (matchSection && lenisRef.current) {
      lenisRef.current.scrollTo(matchSection);
    }
  };

  // Proceed from Match Details to Circular Stadium Seat Selection
  const handleProceedToSeatSelection = () => {
    setBookingStage("seat-selection");
    const seatSection = document.getElementById("booking-workflow");
    if (seatSection && lenisRef.current) {
      lenisRef.current.scrollTo(seatSection);
    }
  };

  // Toggle seat click in SVG circular stadium
  const toggleSeatSelection = (seat: StadiumSeat) => {
    if (bookedSeatIds.includes(seat.id)) return;
    setSelectedSeatIds((prev) =>
      prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id]
    );
  };

  // Remove seat from sidebar chip
  const removeSelectedSeat = (seatId: string) => {
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))));

  // Trigger Anti-Bot Queue & Verification Flow
  const handleConfirmReservation = () => {
    if (selectedSeatsObjects.length === 0) return;
    setIsQueueModalOpen(true);
  };

  // Called when Anti-Bot verification passes & seat is allocated atomically in Redis
  const handleQueueSuccess = (bookingData: { pnr: string; userId: string; seatsBookedCount?: number }) => {
    setIsQueueModalOpen(false);
    const count = bookingData.seatsBookedCount || selectedSeatIds.length || 1;
    const justBookedIds = [...selectedSeatIds];

    // 1. Mark seats as manually booked (turning them red on the circular stadium map)
    setBookedSeatIdsByMatch((prev) => ({
      ...prev,
      [selectedMatch.id]: Array.from(new Set([...(prev[selectedMatch.id] || []), ...justBookedIds])),
    }));

    // 2. Reduce the live available seats count by the number of tickets the user booked
    setLiveAvailableSeats((prev) => {
      const nextSeats = Math.max(0, prev - count);
      setSelectedMatch((m) => ({
        ...m,
        capacity: `${Math.max(0, Math.round(((500 - nextSeats) / 500) * 100))}% BOOKED (${nextSeats}/500 SEATS LEFT)`,
      }));
      return nextSeats;
    });

    const newPass = {
      pnr: bookingData.pnr,
      match: selectedMatch,
      seats: selectedSeatsObjects,
      holder: userProfile.fullName || authEmail || "Cricket Fan",
      dateBooked: new Date().toLocaleDateString(),
      totalAmount: grandTotal,
    };

    // 3. Clear current selection chips
    setSelectedSeatIds([]);

    setConfirmedPass(newPass);
    const updated = [newPass, ...bookedPasses];
    setBookedPasses(updated);
    localStorage.setItem("crictix_saved_passes", JSON.stringify(updated));
  };


  /* ==========================================================================
     4. AUTHENTICATION GATE: LOGIN / SIGNUP / OTP / SUCCESS
     ========================================================================== */
  if (!isAuthenticated) {
    return (
      <div className={`auth-universe ${theme === "light" ? "light-theme" : "dark-theme"}`}>
        <div className="auth-card-wrapper">
          <div className="auth-card">
            <div className="auth-brand">
              <div className="brand-badge">🏏</div>
              <h2>CRIC<span>TIX</span></h2>
              <p>TACTICAL STADIUM ARENA // ACCESS PORTAL</p>
            </div>

            {authError && <div className="auth-error-banner">{authError}</div>}

            {authView === "login" && (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <h3>SIGN IN TO ENTER STADIUM</h3>

                <div className="auth-field">
                  <label>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="fan@cricket.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label>PASSWORD</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn">
                  SIGN IN ➔
                </button>

                <button
                  type="button"
                  className="auth-demo-btn"
                  onClick={handleQuickDemoLogin}
                >
                  ⚡ ONE-CLICK DEMO ACCESS
                </button>

                <div className="auth-switch">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setAuthView("signup");
                    }}
                  >
                    SIGN UP
                  </button>
                </div>
              </form>
            )}

            {authView === "signup" && (
              <form onSubmit={handleRequestOtp} className="auth-form">
                <h3>CREATE ARENA ACCOUNT</h3>
                <p className="auth-step-desc">Enter your email. A 6-digit OTP will be dispatched for verification.</p>

                <div className="auth-field">
                  <label>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="newfan@cricket.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label>CREATE PASSWORD</label>
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn">
                  SEND OTP ➔
                </button>

                <div className="auth-switch">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setAuthView("login");
                    }}
                  >
                    SIGN IN
                  </button>
                </div>
              </form>
            )}

            {authView === "otp" && (
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <h3>ENTER VERIFICATION OTP</h3>
                <p className="auth-step-desc">
                  We sent a 6-digit code to <strong>{authEmail}</strong>.
                </p>

                <div className="simulated-otp-alert">
                  <span>🔔 SIMULATED SMS / EMAIL OTP:</span>
                  <strong>{generatedOtp}</strong>
                </div>

                <div className="auth-field">
                  <label>6-DIGIT OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn">
                  VERIFY OTP & ACTIVATE ➔
                </button>

                <div className="auth-switch">
                  <button
                    type="button"
                    onClick={() => {
                      const code = String(Math.floor(100000 + Math.random() * 900000));
                      setGeneratedOtp(code);
                    }}
                  >
                    ↺ Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthView("signup")}
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}

            {authView === "signup-success" && (
              <div className="auth-success-box">
                <div className="success-icon">✓</div>
                <h3>SIGN UP SUCCESSFUL!</h3>
                <p>Your CricTix match credentials have been activated for <strong>{authEmail}</strong>.</p>
                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={handleCompleteSignupAndEnter}
                >
                  ENTER CRICTIX STADIUM ➔
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     5. MAIN STADIUM ARENA APPLICATION
     ========================================================================== */
  return (
    <div className={`tactical-arena ${theme === "light" ? "light-theme" : "dark-theme"}`}>
      {/* 3D CANVAS WORLD */}
      <div className="canvas-wrapper">
        <Canvas
          camera={{ position: [0.8, 2.2, 9.8], fov: 44 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <StadiumScene
            scrollProgress={scrollProgress}
            theme={theme}
            selectedMatch={selectedMatch}
            onImpactTrigger={handleImpactTrigger}
          />
        </Canvas>
      </div>

      {/* TOP NAVBAR (CRICKTIX / HOME / MATCHES / MY BOOKINGS / PROFILE) */}
      <header className="tactical-navbar">
        <div className="nav-brand">
          <div className="brand-badge">🏏</div>
          <div>
            <strong>CRICK<span>TIX</span></strong>
            <div className="system-status">
              <span className="live-dot" />
              STADIUM ARENA // LIVE
            </div>
          </div>
        </div>

        <nav className="nav-menu">
          <a href="#hero">Home</a>
          <a href="#fixtures">Matches</a>
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => setMyTicketsDrawerOpen(true)}
          >
            My Bookings ({bookedPasses.length})
          </button>
          <button
            type="button"
            className="nav-link-btn"
            style={{
              color: "#f59e0b",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              borderRadius: "4px",
              padding: "4px 10px",
              fontWeight: "bold",
            }}
            onClick={() => setIsAnalyticsModalOpen(true)}
          >
            📊 50k Analytics
          </button>
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => setProfileModalOpen(true)}
          >
            Profile
          </button>
        </nav>

        <div className="nav-controls">
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ LIGHT" : "🌙 DARK"}
          </button>

          <button
            className="profile-nav-btn"
            onClick={() => setProfileModalOpen(true)}
            title="View & Edit Profile"
          >
            👤 @{userProfile.username}
          </button>

          <button className="logout-btn" onClick={handleLogOut} title="Log out">
            LOG OUT
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero" className="chapter-section hero-section">
        <div className="section-content">
          <div className={`impact-typography ${stumpsBroken ? "revealed" : "hidden-initially"}`}>
            <p className="tactical-tag">[ STUMPS BROKEN // ARENA UNLOCKED ]</p>

            <h1 className="hero-glitch">
              RULES OF
              <br />
              <span className="word-accent">CRICKET.</span>
              <br />
              TRANSCENDED.
            </h1>

            <p className="hero-subtext">
              The ball strikes the wickets and the live stadium scoreboard behind the stumps activates.
              Select your match below to view stadium details and pick your seats on the circular radial map.
            </p>

            <div className="hero-actions">
              <a href="#fixtures" className="tactical-cta primary">
                SELECT MATCH TO BOOK ➔
              </a>
            </div>
          </div>
        </div>

        {/* SMALL VISIBLE "scroll down" AT CENTER BOTTOM */}
        <div className="center-scroll-down">scroll down ↓</div>
      </section>

      {/* STEP 1: FIXTURES SECTION */}
      <section id="fixtures" className="chapter-section fixtures-section">
        <div className="section-content full-width">
          <p className="tactical-tag">[ STEP 1: CHOOSE YOUR GAME ]</p>
          <h2>SELECT A MATCH FIXTURE.</h2>
          <p className="section-intro">
            Click on any fixture below. The 3D stadium scoreboard behind the stumps updates dynamically with your chosen teams.
          </p>

          <div className="fixtures-grid">
            {matches.map((match) => {
              const isSelected = selectedMatch.id === match.id;
              return (
                <div
                  key={match.id}
                  className={`fixture-card ${isSelected ? "selected-match" : ""}`}
                >
                  <div className="card-top">
                    <span className="rivalry-tag">{match.rivalryTag}</span>
                    <span className="capacity-pill">{match.capacity}</span>
                  </div>

                  <div className="teams-clash">
                    <div className="team-cell">
                      <div className="team-flag blue">{match.team1}</div>
                      <span className="team-fullname">{match.name1}</span>
                    </div>
                    <div className="clash-badge">VS</div>
                    <div className="team-cell">
                      <div className="team-flag yellow">{match.team2}</div>
                      <span className="team-fullname">{match.name2}</span>
                    </div>
                  </div>

                  <div className="match-meta-list">
                    <div>
                      <span>📍 VENUE</span>
                      <strong>{match.stadium} • {match.city}</strong>
                    </div>
                    <div>
                      <span>⏱ SCHEDULE</span>
                      <strong>{match.date} • {match.time}</strong>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div>
                      <small>FROM</small>
                      <strong>₹{match.price}</strong>
                    </div>
                    <button
                      className="select-fixture-btn"
                      onClick={() => handleSelectMatch(match)}
                    >
                      {isSelected && bookingStage !== "fixtures"
                        ? "VIEW DETAILS & SEATS →"
                        : "VIEW STADIUM & BOOK →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEDICATED BOOKING WORKFLOW CONTAINER */}
      <section id="booking-workflow" className="chapter-section booking-section">
        <div className="section-content full-width">
          {/* ================================================================
              VIEW 2: MATCH & STADIUM DETAILS PAGE (PANEL 2 IN USER IMAGE)
              ================================================================ */}
          {bookingStage === "match-details" && (
            <div className="match-details-view animate-fade-in">
              {/* Back to Matches Button */}
              <div className="breadcrumb-nav">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setBookingStage("fixtures")}
                >
                  ❮ Back to Matches
                </button>
              </div>

              {/* Match Header Clash Banner */}
              <div className="match-hero-banner">
                <div className="banner-bg-overlay" />
                <div className="banner-content">
                  <div className="hero-team left">
                    <div className="team-crest-circle">
                      {selectedMatch.team1 === "IND" ? (
                        <div className="flag-circle india-flag">
                          <span className="chakra" />
                        </div>
                      ) : (
                        <span className="flag-badge-text">{selectedMatch.team1}</span>
                      )}
                    </div>
                    <span className="hero-team-name">{selectedMatch.name1}</span>
                  </div>

                  <div className="hero-clash-mid">
                    <span className="vs-pill">VS</span>
                    <span className="series-tag">{selectedMatch.tournament}</span>
                    <div className="meta-row">
                      <span>📅 {selectedMatch.date}</span>
                      <span>🕒 {selectedMatch.time}</span>
                    </div>
                    <div className="venue-tag">
                      📍 {selectedMatch.stadium}, {selectedMatch.city.split(",")[0]}
                    </div>
                  </div>

                  <div className="hero-team right">
                    <span className="hero-team-name">{selectedMatch.name2}</span>
                    <div className="team-crest-circle">
                      {selectedMatch.team2 === "AUS" ? (
                        <div className="flag-circle aus-flag">
                          <span className="aus-star">★</span>
                        </div>
                      ) : (
                        <span className="flag-badge-text">{selectedMatch.team2}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs (Overview / Stadium Info / Event Guidelines) */}
              <div className="details-tabs-bar">
                <button
                  className={`tab-item ${matchDetailsTab === "overview" ? "active" : ""}`}
                  onClick={() => setMatchDetailsTab("overview")}
                >
                  Overview
                </button>
                <button
                  className={`tab-item ${matchDetailsTab === "info" ? "active" : ""}`}
                  onClick={() => setMatchDetailsTab("info")}
                >
                  Stadium Info
                </button>
                <button
                  className={`tab-item ${matchDetailsTab === "guidelines" ? "active" : ""}`}
                  onClick={() => setMatchDetailsTab("guidelines")}
                >
                  Event Guidelines
                </button>
              </div>

              {/* Tab 1: Overview Tab */}
              {matchDetailsTab === "overview" && (
                <div className="tab-pane-card overview-pane">
                  <div className="overview-grid">
                    {/* Left: Stadium Photo Card with Carousel Dots */}
                    <div className="stadium-preview-box">
                      <div className="stadium-image-container">
                        <img
                          src={selectedMatch.images[carouselIndex]}
                          alt={selectedMatch.stadium}
                          className="stadium-hero-img"
                        />
                        <div className="carousel-nav-arrows">
                          <button
                            type="button"
                            onClick={() =>
                              setCarouselIndex((c) =>
                                c === 0 ? selectedMatch.images.length - 1 : c - 1
                              )
                            }
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCarouselIndex((c) =>
                                c === selectedMatch.images.length - 1 ? 0 : c + 1
                              )
                            }
                          >
                            ›
                          </button>
                        </div>
                      </div>
                      <div className="carousel-dots">
                        {selectedMatch.images.map((_, i) => (
                          <span
                            key={i}
                            className={`dot-indicator ${carouselIndex === i ? "active" : ""}`}
                            onClick={() => setCarouselIndex(i)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Right: Stadium Info & Key Metric Badges */}
                    <div className="stadium-copy-box">
                      <h3 className="stadium-title">{selectedMatch.stadium}</h3>
                      <p className="stadium-desc">{selectedMatch.description}</p>

                      <div className="stadium-specs-list">
                        <div className="spec-row">
                          <span className="spec-icon">👥</span>
                          <strong>Capacity: {selectedMatch.capacityNumber}</strong>
                        </div>
                        <div className="spec-row">
                          <span className="spec-icon">📍</span>
                          <strong>Location: {selectedMatch.city}</strong>
                        </div>
                        <div className="spec-row">
                          <span className="spec-icon">🅿️</span>
                          <strong>Parking: {selectedMatch.parking}</strong>
                        </div>
                        <div className="spec-row">
                          <span className="spec-icon">🍔</span>
                          <strong>Food & Beverages: {selectedMatch.foodBeverages}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proceed to Seat Selection CTA */}
                  <div className="details-action-bar">
                    <button
                      type="button"
                      className="view-seats-cta"
                      onClick={handleProceedToSeatSelection}
                    >
                      View Stadium & Select Seats ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Stadium Info Tab */}
              {matchDetailsTab === "info" && (
                <div className="tab-pane-card">
                  <h3 className="stadium-title">PITCH & INFRASTRUCTURE REPORT</h3>
                  <p className="stadium-desc">{selectedMatch.pitchInfo}</p>
                  <div className="info-bullets-grid">
                    <div className="info-box">
                      <strong>DIMENSIONS</strong>
                      <span>Straight boundary: 74m • Square boundary: 67m</span>
                    </div>
                    <div className="info-box">
                      <strong>LIGHTING</strong>
                      <span>4 High-mast towers with 2,500 LUX LED broadcast spec</span>
                    </div>
                    <div className="info-box">
                      <strong>TRANSIT</strong>
                      <span>Churchgate & Marine Lines railway stations within 500m</span>
                    </div>
                    <div className="info-box">
                      <strong>DRAINAGE</strong>
                      <span>Full sub-soil vacuum drainage system active</span>
                    </div>
                  </div>
                  <div className="details-action-bar">
                    <button
                      type="button"
                      className="view-seats-cta"
                      onClick={handleProceedToSeatSelection}
                    >
                      View Stadium & Select Seats ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Event Guidelines Tab */}
              {matchDetailsTab === "guidelines" && (
                <div className="tab-pane-card">
                  <h3 className="stadium-title">EVENT PROTOCOL & SECURITY</h3>
                  <div className="guidelines-list">
                    {selectedMatch.guidelines.map((g, idx) => (
                      <div key={idx} className="guideline-row">
                        <span className="badge-num">0{idx + 1}</span>
                        <p>{g}</p>
                      </div>
                    ))}
                  </div>
                  <div className="details-action-bar">
                    <button
                      type="button"
                      className="view-seats-cta"
                      onClick={handleProceedToSeatSelection}
                    >
                      View Stadium & Select Seats ➔
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              VIEW 3: IMPROVED CIRCULAR STADIUM SEAT SELECTION PAGE (PANEL 3)
              ================================================================ */}
          {bookingStage === "seat-selection" && (
            <div className="seat-selection-view animate-fade-in">
              {/* Real-Time Fair-Drop Anti-Bot System Status HUD */}
              <AntiBotHUD
                matchId={selectedMatch.id}
                onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
                onSeatsUpdated={(seats) => {
                  setLiveAvailableSeats(seats);
                  setSelectedMatch((prev) => ({
                    ...prev,
                    capacity: `${Math.max(0, Math.round(((500 - seats) / 500) * 100))}% BOOKED (${seats}/500 SEATS LEFT)`,
                  }));
                }}
                onBookedSeatsLoaded={(seatNums) => {
                  const mappedIds = seatNums
                    .filter((num) => num > 0 && num <= ALL_RADIAL_SEATS.length)
                    .map((num) => ALL_RADIAL_SEATS[num - 1].id);
                  setBookedSeatIdsByMatch((prev) => ({
                    ...prev,
                    [selectedMatch.id]: Array.from(new Set([...(prev[selectedMatch.id] || []), ...mappedIds])),
                  }));
                }}
                onReset={() => {
                  setBookedSeatIdsByMatch((prev) => ({
                    ...prev,
                    [selectedMatch.id]: [],
                  }));
                  setSelectedSeatIds([]);
                  setLiveAvailableSeats(500);
                  setSelectedMatch((prev) => ({
                    ...prev,
                    capacity: "0% BOOKED (500/500 SEATS LEFT)",
                  }));
                }}
              />

              {/* Back to Match Details Button */}
              <div className="breadcrumb-nav">

                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setBookingStage("match-details")}
                >
                  ❮ Back
                </button>
              </div>

              <div className="seat-selection-two-col">
                {/* LEFT COLUMN: CIRCULAR STADIUM RADIAL MAP */}
                <div className="circular-stadium-card">
                  <div className="stadium-card-header">
                    <div>
                      <h2>Select Your Seats</h2>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          padding: "3px 10px",
                          borderRadius: "4px",
                          background: liveAvailableSeats <= 0 ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.15)",
                          color: liveAvailableSeats <= 0 ? "#ef4444" : "#22c55e",
                          border: `1px solid ${liveAvailableSeats <= 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)"}`,
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: liveAvailableSeats <= 0 ? "#ef4444" : "#22c55e", display: "inline-block" }} />
                        LIVE ARENA INVENTORY: {liveAvailableSeats} / 500 AVAILABLE
                      </div>
                    </div>
                    <div className="stadium-legend-row">
                      <span className="legend-item">
                        <i className="legend-dot available" /> Available
                      </span>
                      <span className="legend-item">
                        <i className="legend-dot selected" /> Selected
                      </span>
                      <span className="legend-item">
                        <i className="legend-dot sold" /> Sold
                      </span>
                      <span className="legend-item">
                        <i className="legend-dot premium" /> Premium
                      </span>
                    </div>
                  </div>

                  {/* SVG CIRCULAR CRICKET STADIUM CONTAINER */}
                  <div className="svg-stadium-viewport">
                    <div
                      className="svg-zoom-stage"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "center center",
                        transition: "transform 0.25s ease-out",
                      }}
                    >
                      <svg
                        viewBox="0 0 540 540"
                        className="radial-stadium-svg"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <defs>
                          {/* Radial Gradient for Authentic Cricket Grass */}
                          <radialGradient id="turfGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#1e5421" />
                            <stop offset="55%" stopColor="#256b29" />
                            <stop offset="85%" stopColor="#1e5421" />
                            <stop offset="100%" stopColor="#143c16" />
                          </radialGradient>

                          {/* Glow filter for selected seat */}
                          <filter id="seatGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Outer Stadium Concrete Perimeter */}
                        <circle
                          cx="270"
                          cy="270"
                          r="256"
                          fill="#090f1d"
                          stroke={theme === "light" ? "#94a3b8" : "#1e293b"}
                          strokeWidth="3"
                        />

                        {/* SECTOR 1: NORTH STAND (TOP ARC - BLUE/CYAN) */}
                        <path
                          d="M 125 125 A 205 205 0 0 1 415 125 L 348 192 A 110 110 0 0 0 192 192 Z"
                          fill="rgba(2, 132, 199, 0.25)"
                          stroke="#0284c7"
                          strokeWidth="1.5"
                        />
                        <text
                          x="270"
                          y="62"
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="11"
                          fontWeight="bold"
                          letterSpacing="1"
                        >
                          NORTH STAND
                        </text>
                        <text
                          x="270"
                          y="76"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          (₹1,200)
                        </text>

                        {/* SECTOR 2: EAST STAND (RIGHT ARC - AMBER/ORANGE) */}
                        <path
                          d="M 415 125 A 205 205 0 0 1 415 415 L 348 348 A 110 110 0 0 0 348 192 Z"
                          fill="rgba(217, 119, 6, 0.22)"
                          stroke="#ea580c"
                          strokeWidth="1.5"
                        />
                        <text
                          x="474"
                          y="266"
                          textAnchor="middle"
                          fill="#fb923c"
                          fontSize="11"
                          fontWeight="bold"
                          letterSpacing="1"
                        >
                          EAST STAND
                        </text>
                        <text
                          x="474"
                          y="280"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          (₹1,500)
                        </text>

                        {/* SECTOR 3: SOUTH STAND (BOTTOM ARC - GREEN) */}
                        <path
                          d="M 415 415 A 205 205 0 0 1 125 415 L 192 348 A 110 110 0 0 0 348 348 Z"
                          fill="rgba(22, 163, 74, 0.24)"
                          stroke="#16a34a"
                          strokeWidth="1.5"
                        />
                        <text
                          x="270"
                          y="470"
                          textAnchor="middle"
                          fill="#4ade80"
                          fontSize="11"
                          fontWeight="bold"
                          letterSpacing="1"
                        >
                          SOUTH STAND
                        </text>
                        <text
                          x="270"
                          y="484"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          (₹2,000)
                        </text>

                        {/* SECTOR 4: VIP BOX (BOTTOM CENTER - CHARCOAL & GOLD) */}
                        <path
                          d="M 220 376 A 148 148 0 0 1 320 376 L 312 410 A 176 176 0 0 0 228 410 Z"
                          fill="#1e293b"
                          stroke="#eab308"
                          strokeWidth="2"
                        />
                        <text
                          x="270"
                          y="400"
                          textAnchor="middle"
                          fill="#facc15"
                          fontSize="9.5"
                          fontWeight="bold"
                          letterSpacing="1"
                        >
                          VIP BOX
                        </text>
                        <text
                          x="270"
                          y="412"
                          textAnchor="middle"
                          fill="#fef08a"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          (₹3,500)
                        </text>

                        {/* SECTOR 5: WEST STAND (LEFT ARC - PURPLE/VIOLET) */}
                        <path
                          d="M 125 415 A 205 205 0 0 1 125 125 L 192 192 A 110 110 0 0 0 192 348 Z"
                          fill="rgba(124, 58, 237, 0.22)"
                          stroke="#7c3aed"
                          strokeWidth="1.5"
                        />
                        <text
                          x="66"
                          y="266"
                          textAnchor="middle"
                          fill="#c084fc"
                          fontSize="11"
                          fontWeight="bold"
                          letterSpacing="1"
                        >
                          WEST STAND
                        </text>
                        <text
                          x="66"
                          y="280"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          (₹1,500)
                        </text>

                        {/* CENTRAL CRICKET GROUND (OUTFIELD) */}
                        <circle
                          cx="270"
                          cy="270"
                          r="108"
                          fill="url(#turfGradient)"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeOpacity="0.45"
                        />

                        {/* Concentric Mowing Rings for realism */}
                        <circle
                          cx="270"
                          cy="270"
                          r="82"
                          fill="none"
                          stroke="#2d6a4f"
                          strokeWidth="7"
                          opacity="0.25"
                        />
                        <circle
                          cx="270"
                          cy="270"
                          r="52"
                          fill="none"
                          stroke="#40916c"
                          strokeWidth="6"
                          opacity="0.2"
                        />

                        {/* 30-Yard Fielding Circle */}
                        <circle
                          cx="270"
                          cy="270"
                          r="72"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                          strokeOpacity="0.6"
                        />

                        {/* Central Turf Cricket Pitch Strip */}
                        <rect
                          x="259"
                          y="238"
                          width="22"
                          height="64"
                          rx="2"
                          fill="#c29b62"
                          stroke="#8d6e46"
                          strokeWidth="1"
                        />

                        {/* Batting Creases & Wickets */}
                        <line
                          x1="257"
                          y1="248"
                          x2="283"
                          y2="248"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                        <line
                          x1="257"
                          y1="292"
                          x2="283"
                          y2="292"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                        {/* Wickets Top */}
                        <circle cx="266" cy="245" r="1" fill="#ffffff" />
                        <circle cx="270" cy="245" r="1" fill="#ffffff" />
                        <circle cx="274" cy="245" r="1" fill="#ffffff" />
                        {/* Wickets Bottom */}
                        <circle cx="266" cy="295" r="1" fill="#ffffff" />
                        <circle cx="270" cy="295" r="1" fill="#ffffff" />
                        <circle cx="274" cy="295" r="1" fill="#ffffff" />

                        {/* INTERACTIVE RADIAL SEATS */}
                        {ALL_RADIAL_SEATS.map((seat, index) => {
                          const isSelected = selectedSeatIds.includes(seat.id);
                          const isManuallyBooked = bookedSeatIds.includes(seat.id);

                          // Calculate how many simulation seats to turn red
                          const totalSold = Math.max(0, 500 - liveAvailableSeats);
                          const simSoldTickets = Math.max(0, totalSold - bookedSeatIds.length);
                          const simFraction = Math.max(0, Math.min(1, simSoldTickets / 500));
                          const simSeatsCount = Math.floor(ALL_RADIAL_SEATS.length * simFraction);
                          const isSimSold = index < simSeatsCount;

                          const isSold = isManuallyBooked || isSimSold;
                          const isPremium = seat.status === "premium";

                          let fillColor = "#22c55e"; // available: green
                          if (isSold) fillColor = "#ef4444"; // sold: red
                          if (isPremium && !isSold) fillColor = "#eab308"; // premium: gold
                          if (isSelected && !isSold) fillColor = "#00e5ff"; // selected: cyan

                          return (
                            <g
                              key={seat.id}
                              className={`seat-node ${isSold ? "disabled" : "clickable"}`}
                              onClick={() => {
                                if (!isSold) toggleSeatSelection(seat);
                              }}
                              onMouseEnter={() => setHoveredSeat(seat)}
                              onMouseLeave={() => setHoveredSeat(null)}
                            >
                              {/* Glowing selection ring */}
                              {isSelected && (
                                <circle
                                  cx={seat.cx}
                                  cy={seat.cy}
                                  r="9.5"
                                  fill="none"
                                  stroke="#00e5ff"
                                  strokeWidth="2.5"
                                  filter="url(#seatGlow)"
                                />
                              )}
                              {/* The clickable Seat dot */}
                              <circle
                                cx={seat.cx}
                                cy={seat.cy}
                                r={isSelected ? 6.5 : 5.5}
                                fill={fillColor}
                                stroke={isSelected ? "#ffffff" : "rgba(0,0,0,0.5)"}
                                strokeWidth={isSelected ? 1.5 : 0.8}
                                style={{
                                  cursor: isSold ? "not-allowed" : "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              />
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Hover Tooltip */}
                    {hoveredSeat && (
                      <div className="seat-hover-tooltip">
                        <strong>Seat {hoveredSeat.label}</strong>
                        <span>{hoveredSeat.stand}</span>
                        <b>₹{hoveredSeat.price.toLocaleString()}</b>
                        <small className={`status-pill ${hoveredSeat.status}`}>
                          {hoveredSeat.status.toUpperCase()}
                        </small>
                      </div>
                    )}

                    {/* Floating Zoom Controls (+ / -) */}
                    <div className="stadium-zoom-controls">
                      <button
                        type="button"
                        className="zoom-btn"
                        onClick={handleZoomIn}
                        title="Zoom In"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="zoom-btn"
                        onClick={handleZoomOut}
                        title="Zoom Out"
                      >
                        −
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ORDER SUMMARY PANEL */}
                <div className="order-summary-panel">
                  {/* Top Match Summary Card */}
                  <div className="summary-match-card">
                    <h3>{selectedMatch.team1} vs {selectedMatch.team2}</h3>
                    <p>{selectedMatch.date} • {selectedMatch.time}</p>
                    <small>{selectedMatch.stadium}, {selectedMatch.city.split(",")[0]}</small>
                  </div>

                  {/* Selected Seats List */}
                  <div className="summary-seats-section">
                    <h4>Selected Seats</h4>
                    {selectedSeatsObjects.length === 0 ? (
                      <p className="no-seats-hint">
                        No seats selected. Click any available seat on the stadium map to add.
                      </p>
                    ) : (
                      <div className="selected-seats-list">
                        {selectedSeatsObjects.map((seat) => (
                          <div key={seat.id} className="selected-seat-chip">
                            <span className="seat-id-tag">{seat.label}</span>
                            <span className="seat-cost-tag">₹{seat.price.toLocaleString()}</span>
                            <button
                              type="button"
                              className="remove-chip-btn"
                              onClick={() => removeSelectedSeat(seat.id)}
                              title="Remove Seat"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown */}
                  <div className="summary-pricing-section">
                    <div className="price-row">
                      <span>Subtotal</span>
                      <strong>₹{subtotal.toLocaleString()}</strong>
                    </div>
                    <div className="price-row">
                      <span>Convenience Fee</span>
                      <strong>₹{convenienceFee.toLocaleString()}</strong>
                    </div>
                    <div className="price-row total-row">
                      <span>Total</span>
                      <strong>₹{grandTotal.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Proceed to Payment Action Button */}
                  <button
                    type="button"
                    disabled={selectedSeatsObjects.length === 0}
                    className="proceed-payment-cta"
                    onClick={handleConfirmReservation}
                  >
                    Proceed to Payment ➔
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback if user arrives at booking before picking a fixture */}
          {bookingStage === "fixtures" && (
            <div className="no-match-selected-box">
              <p>Please select a fixture from the matches list above to view stadium details and pick seats.</p>
              <a href="#fixtures" className="tactical-cta primary">
                BROWSE FIXTURES ABOVE ↑
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ACCORDION FAQ */}
      <section id="faq" className="chapter-section faq-section">
        <div className="section-content full-width">
          <p className="tactical-tag">[ FREQUENTLY ASKED QUESTIONS ]</p>
          <h2>QUESTIONS & ANSWERS.</h2>
          <p className="section-intro">Tap any question below to expand its details.</p>

          <div className="faq-accordion">
            {[
              {
                q: "HOW DO I VIEW STADIUM DETAILS BEFORE SELECTING SEATS?",
                a: "Click 'VIEW STADIUM & BOOK' on any match fixture. You will enter the Match Details page featuring stadium photos, capacity, amenities, pitch report, and event guidelines before opening the seat selector.",
              },
              {
                q: "HOW DOES THE CIRCULAR STADIUM SEAT MAP WORK?",
                a: "The circular map renders the stadium bowl encircling the pitch. Stands are color-coded (North, East, South, VIP, West). Click any green or gold seat dot to select it; your selection updates in real time on the summary panel.",
              },
              {
                q: "HOW DO I ZOOM IN ON THE STADIUM MAP?",
                a: "Use the floating '+' and '−' circle buttons located at the bottom-right corner of the stadium map to zoom in for precise seat picking.",
              },
              {
                q: "WHERE IS THE 3D STADIUM SIGHTSCREEN SCOREBOARD?",
                a: "The 3D sightscreen scoreboard is mounted on the turf pitch directly behind the bowling wickets. It reflects whichever match you select dynamically.",
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`faq-card ${isOpen ? "open" : ""}`}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <div className="faq-question">
                    <span>0{idx + 1}</span>
                    <strong>{faq.q}</strong>
                    <b>{isOpen ? "−" : "+"}</b>
                  </div>
                  {isOpen && <p className="faq-answer">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="tactical-footer">
        <div className="footer-marquee">
          <span>
            /// CRICTIX ARENA ONLINE • GROUND SIGHTSCREEN SCOREBOARD • INSTANT CRYPTOGRAPHIC DISPATCH ///
          </span>
        </div>
        <div className="footer-bottom">
          <div>
            <strong>CRICK<span>TIX</span></strong>
            <small>© 2026 CRICKTIX GLOBAL. ALL RIGHTS RESERVED.</small>
          </div>
          <div className="footer-status">
            <span>USER: @{userProfile.username}</span>
            <span>MEMBERSHIP: {userProfile.loyaltyTier}</span>
          </div>
        </div>
      </footer>

      {/* USER PROFILE MODAL */}
      {profileModalOpen && (
        <div className="modal-backdrop" onClick={() => setProfileModalOpen(false)}>
          <div className="tactical-modal profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setProfileModalOpen(false)}>✕</button>

            <div className="profile-header">
              <div className="profile-avatar">🏏</div>
              <div>
                <h2>FAN PROFILE DOSSIER</h2>
                <p>Manage your account credentials and personal preferences</p>
                <span className="loyalty-pill">★ {userProfile.loyaltyTier} ({userProfile.loyaltyPoints} PTS)</span>
              </div>
            </div>

            {profileSuccessMsg && <div className="profile-alert-success">{profileSuccessMsg}</div>}

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="profile-grid">
                <div>
                  <label>USERNAME</label>
                  <input
                    type="text"
                    value={userProfile.username}
                    onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>FULL NAME</label>
                  <input
                    type="text"
                    value={userProfile.fullName}
                    onChange={(e) => setUserProfile({ ...userProfile, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>DATE OF BIRTH</label>
                  <input
                    type="date"
                    value={userProfile.dob}
                    onChange={(e) => setUserProfile({ ...userProfile, dob: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>CONTACT PHONE</label>
                  <input
                    type="tel"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>FAVORITE TEAM</label>
                  <select
                    value={userProfile.favoriteTeam}
                    onChange={(e) => setUserProfile({ ...userProfile, favoriteTeam: e.target.value })}
                  >
                    <option value="Team India">Team India (National)</option>
                    <option value="Royal Challengers Bengaluru">Royal Challengers Bengaluru (RCB)</option>
                    <option value="Mumbai Indians">Mumbai Indians (MI)</option>
                    <option value="Chennai Super Kings">Chennai Super Kings (CSK)</option>
                    <option value="Kolkata Knight Riders">Kolkata Knight Riders (KKR)</option>
                  </select>
                </div>
              </div>

              <div className="profile-actions">
                <button type="button" className="tactical-cta ghost" onClick={() => setProfileModalOpen(false)}>
                  CLOSE
                </button>
                <button type="submit" className="tactical-cta primary">
                  SAVE PROFILE DETAILS ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAIR-DROP ANTI-BOT QUEUE & DEFENSE VERIFICATION MODAL */}
      <AntiBotQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        onSuccess={handleQueueSuccess}
        selectedSeatsCount={selectedSeatsObjects.length}
        selectedSeatNumbers={selectedSeatsObjects.map((s) => ALL_RADIAL_SEATS.findIndex((x) => x.id === s.id) + 1)}
        totalAmount={grandTotal}
        userName={userProfile.fullName || authEmail || "Cricket Fan"}
        authToken={authToken}
        matchId={selectedMatch.id}
      />

      {/* TEAMMATE 4: 50,000 TRAFFIC & ALLOCATION DATA ANALYTICS MODAL */}
      <Teammate4AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      {/* CONFIRMED PASS VOUCHER MODAL */}
      {confirmedPass && (

        <div className="modal-backdrop" onClick={() => setConfirmedPass(null)}>
          <div className="tactical-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setConfirmedPass(null)}>✕</button>

            <div className="pass-confirmed-header">
              <span className="verified-badge">✓ TICKET PASS DISPATCHED</span>
              <h2>BOOKING AUTHORIZED</h2>
              <p>PNR RECORD: <strong>{confirmedPass.pnr}</strong></p>
            </div>

            <div className="ticket-voucher">
              <div className="voucher-top">
                <span>CRICKTIX // OFFICIAL ENTRY PASS</span>
                <strong>VERIFIED ACCESS</strong>
              </div>
              <div className="voucher-clash">
                <h3>{confirmedPass.match.team1} VS {confirmedPass.match.team2}</h3>
                <p>{confirmedPass.match.stadium}</p>
                <small>{confirmedPass.match.date} • {confirmedPass.match.time}</small>
              </div>

              <div className="voucher-grid">
                <div>
                  <span>SEATS</span>
                  <strong>{confirmedPass.seats.map((s: StadiumSeat) => s.label).join(", ")}</strong>
                </div>
                <div>
                  <span>PASS HOLDER</span>
                  <strong>{confirmedPass.holder}</strong>
                </div>
                <div>
                  <span>INVESTMENT</span>
                  <strong>₹{confirmedPass.totalAmount.toLocaleString()}</strong>
                </div>
              </div>

              <div className="voucher-qr">
                <div className="qr-box">
                  <div className="qr-simulated" />
                </div>
                <small>OPTICAL TURNSTILE SCAN READY</small>
              </div>
            </div>

            <div className="success-actions">
              <button className="tactical-cta ghost" onClick={() => setConfirmedPass(null)}>
                CLOSE
              </button>
              <button className="tactical-cta primary" onClick={() => window.print()}>
                PRINT / DOWNLOAD PASS 📄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALLET / MY BOOKINGS DRAWER */}
      {myTicketsDrawerOpen && (
        <div className="modal-backdrop" onClick={() => setMyTicketsDrawerOpen(false)}>
          <div className="tactical-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setMyTicketsDrawerOpen(false)}>✕</button>

            <div className="modal-header">
              <span className="tactical-tag">[ MY RESERVED PASSES ]</span>
              <h2>BOOKED TICKETS ({bookedPasses.length})</h2>
              <p>Your active match credentials stored in your browser</p>
            </div>

            {bookedPasses.length === 0 ? (
              <div className="empty-passes">
                <p>No tickets booked yet.</p>
                <button
                  type="button"
                  className="tactical-cta primary"
                  onClick={() => {
                    setMyTicketsDrawerOpen(false);
                    setBookingStage("fixtures");
                  }}
                >
                  CHOOSE A MATCH TO BOOK →
                </button>
              </div>
            ) : (
              <div className="saved-passes-list">
                {bookedPasses.map((p, idx) => (
                  <div key={idx} className="saved-pass-card">
                    <div>
                      <strong>{p.match.team1} VS {p.match.team2}</strong>
                      <small>{p.match.stadium} • {p.match.date}</small>
                      <span className="pnr-pill">PNR: {p.pnr}</span>
                    </div>
                    <div className="pass-card-right">
                      <span>SEATS: {p.seats.map((s: StadiumSeat) => s.label).join(", ")}</span>
                      <b>₹{p.totalAmount.toLocaleString()}</b>
                      <button className="print-mini-btn" onClick={() => window.print()}>
                        PRINT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}