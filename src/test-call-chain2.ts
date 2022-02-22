import { aa } from './func'

function f11() {
    aa();
}

function f22() {
    f11();
}

function myName() {
    f22();
}

myName()