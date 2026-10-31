import "cypress-real-events/support";
import dotenv from 'dotenv';
dotenv.config();

const timestamp = Date.now();
const frontend_name = `Test-User_${timestamp}`;
const frontend_email = `test-user_${timestamp}@gmail.com`;
const frontend_password = "12345678";

describe('Blog App Frontend Tests', () => {
  before(() => {
    cy.visit('/');
    cy.contains('Signup').click();
    cy.get('input[name="name"]').type(frontend_name);
    cy.get('input[name="email"]').type(frontend_email);
    cy.get('input[name="password"]').type(frontend_password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/');
    cy.contains('Logout').should('be.visible');
  });

  beforeEach(() => {
    cy.session('loginSession', () => {
      cy.visit('/');
      cy.contains('Login').click();
      cy.get('input[name="email"]').type(frontend_email);
      cy.get('input[name="password"]').type(frontend_password);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/');
      cy.contains('Logout').should('be.visible');
    });
  });

  it('Should display Blog App in navbar', () => {
    cy.visit('/');
    cy.get('nav').contains('Blog App').should('be.visible');
  });

  it('Should have Home, Login, and Signup buttons in Navbar (logged out)', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.get('nav').contains('Home').should('be.visible');
    cy.get('nav').contains('Login').should('be.visible');
    cy.get('nav').contains('Signup').should('be.visible');
  });

  it('Should show Explore Posts section', () => {
    cy.visit('/');
    cy.contains('Explore Posts').should('be.visible');
  });

  it('Should allow typing in search and filter inputs', () => {
    cy.visit('/');
    cy.get('input[placeholder="Search by keyword..."]').type('React').should('have.value', 'React');
    cy.get('input[placeholder="Filter by tags (comma-separated)"]').type('frontend').should('have.value', 'frontend');
  });

  it('Should show Google login/signup options', () => {
    cy.clearLocalStorage();
    cy.visit('/');
    cy.contains('Signup').click();
    cy.get('.google-signin-button iframe, .google-signin-unavailable').should('exist');

    cy.visit('/');
    cy.contains('Login').click();
    cy.get('.google-signin-button iframe, .google-signin-unavailable').should('exist');
  });

  it('User should see their profile', () => {
    cy.visit('/');
    cy.contains('Profile').click();
    cy.contains(frontend_email).should('be.visible');
    cy.contains(frontend_name).should('be.visible');
    cy.contains("Total Posts: 0").should('be.visible');
  });

  it('User should access dashboard', () => {
    cy.visit('/');
    cy.contains('Dashboard').click();
    cy.contains('My Posts').should('be.visible');
    cy.contains('+ Create Post').should('be.visible');
  });

  it('User should create a post', () => {
    cy.visit('/');
    cy.contains('Dashboard').click();
    cy.contains('+ Create Post').click();
    cy.get('input[name="title"]').type("Test Post");
    cy.get('textarea[name="content"]').type("This is a test post content.");
    cy.get('input[name="tags"]').type("test, cypress");
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/create');
  });

  it('User should view their post in dashboard', () => {
    cy.visit('/');
    cy.contains('Dashboard').click();
    cy.contains("Test Post").should("be.visible");
    cy.contains("View").should("be.visible");
    cy.contains("Edit").should("be.visible");
    cy.contains("Delete").should("be.visible");
  });

});