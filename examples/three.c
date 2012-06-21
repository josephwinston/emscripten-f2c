/* three.f -- translated by f2c (version 20100827).
   You must link the resulting object file with libf2c:
	on Microsoft Windows system, link with libf2c.lib;
	on Linux or Unix systems, link with .../path/to/libf2c.a -lm
	or, if you install libf2c.a in a standard place, with -lf2c -lm
	-- in that order, at the end of the command line, as in
		cc *.o -lf2c -lm
	Source for libf2c is in /netlib/f2c/libf2c.zip, e.g.,

		http://www.netlib.org/f2c/libf2c.zip
*/

#include "f2c.h"

/* Table of constant values */

static integer c__9 = 9;
static integer c__1 = 1;
static integer c__4 = 4;
static integer c__3 = 3;

/* Main program */ int MAIN__(void)
{
    /* Builtin functions */
    integer s_wsle(cilist *), do_lio(integer *, integer *, char *, ftnlen), 
	    e_wsle(void);
    /* Subroutine */ int s_stop(char *, ftnlen);

    /* Local variables */
    static integer i__;
    static real x;
    static integer inte;
    static real reale;
    static integer intpi;
    static real realpi;

    /* Fortran I/O blocks */
    static cilist io___3 = { 0, 6, 0, 0, 0 };
    static cilist io___4 = { 0, 6, 0, 0, 0 };
    static cilist io___7 = { 0, 6, 0, 0, 0 };
    static cilist io___8 = { 0, 6, 0, 0, 0 };
    static cilist io___11 = { 0, 6, 0, 0, 0 };
    static cilist io___12 = { 0, 6, 0, 0, 0 };


    i__ = 1;
    x = 1.f;
    s_wsle(&io___3);
    do_lio(&c__9, &c__1, "THE VALUE OF 1 AS A REAL IS", (ftnlen)27);
    do_lio(&c__4, &c__1, (char *)&x, (ftnlen)sizeof(real));
    e_wsle();
    s_wsle(&io___4);
    do_lio(&c__9, &c__1, "THE VALUE OF 1 AS AN INTEGER IS", (ftnlen)31);
    do_lio(&c__3, &c__1, (char *)&i__, (ftnlen)sizeof(integer));
    e_wsle();
    realpi = 3.1416f;
    intpi = realpi;
    s_wsle(&io___7);
    do_lio(&c__9, &c__1, "THE VALUE OF PI AS A REAL IS", (ftnlen)28);
    do_lio(&c__4, &c__1, (char *)&realpi, (ftnlen)sizeof(real));
    e_wsle();
    s_wsle(&io___8);
    do_lio(&c__9, &c__1, "THE VALUE OF PI AS AN INTEGER IS", (ftnlen)32);
    do_lio(&c__3, &c__1, (char *)&intpi, (ftnlen)sizeof(integer));
    e_wsle();
    reale = 2.71828f;
    inte = reale;
    s_wsle(&io___11);
    do_lio(&c__9, &c__1, "THE VALUE OF E AS A REAL IS", (ftnlen)27);
    do_lio(&c__4, &c__1, (char *)&reale, (ftnlen)sizeof(real));
    e_wsle();
    s_wsle(&io___12);
    do_lio(&c__9, &c__1, "THE VALUE OF E AS AN INTEGER IS", (ftnlen)31);
    do_lio(&c__3, &c__1, (char *)&inte, (ftnlen)sizeof(integer));
    e_wsle();
    s_stop("", (ftnlen)0);
    return 0;
} /* MAIN__ */

/* Main program alias */ int main_ () { MAIN__ (); return 0; }
