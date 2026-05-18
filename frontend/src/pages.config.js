/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AuditLogs from './pages/AuditLogs.jsx';
import Dashboard from './pages/dashboard.jsx';
import Documents from './pages/documents.jsx';
import Feedback from './pages/feedback.jsx';
import History from './pages/history.jsx';
import Home from './pages/home.jsx';
import Policies from './pages/policies.jsx';
import Profile from './pages/profile.jsx';
import Search from './pages/search.jsx';
import Login from './pages/Login.jsx';
import __Layout from './layout.jsx';

export const PAGES = {
    "AuditLogs": AuditLogs,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Feedback": Feedback,
    "History": History,
    "Home": Home,
    "Policies": Policies,
    "Profile": Profile,
    "Search": Search,
    "Login": Login,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
