
import "./NavigationBar.css";

import { Link } from "react-router-dom";
import { paths } from "../component";
import { useEffect } from "react";

const showNavbarElements = () => {
    const navbar: HTMLElement = document.querySelector(".nav_bar") as HTMLElement;
    const tableBG: HTMLDivElement | null = document.querySelector(".table_container");
    navbar.style.setProperty("height", "8vh");
    navbar.style.setProperty("line-height", "8vh");
    navbar.style.setProperty("font-size", "1.5vw");
    tableBG?.style.setProperty("top", "calc(6.67vw + 4vh)");
}

const hideNavbarElements = () => {
    const navbar: HTMLElement = document.querySelector(".nav_bar") as HTMLElement;
    const tableBG: HTMLDivElement | null = document.querySelector(".table_container");
    navbar.style.setProperty("height", "4vh");
    navbar.style.setProperty("line-height", "5vw");
    navbar.style.setProperty("font-size", "0vw");
    tableBG?.style.setProperty("top", "calc(7vw)");
}

export default function NavigationBar() {
    useEffect(() => {
        const navbar: HTMLElement = document.querySelector(".nav_bar") as HTMLElement;
        navbar.addEventListener("mouseenter", showNavbarElements);
        navbar.addEventListener("mouseleave", hideNavbarElements);

        return () => {
            navbar.removeEventListener("mouseenter", showNavbarElements);
            navbar.removeEventListener("mouseleave", hideNavbarElements);
        }
    })
    return (
        <div className="nav_bar">
            {
                paths.map((path, index) => {
                    return (
                        <Link to={path.path} key={index} className="nav_button">
                            {path.name}
                        </Link>
                    )
                })
            }
        </div>
    );
}