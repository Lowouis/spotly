'use client';

import {cn} from "@/lib/utils";

export default function SnakeLogo({className, title = "Logo Spotly"}) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1254 1254"
            role="img"
            aria-label={title}
            className={cn("text-neutral-950 dark:text-neutral-50", className)}
        >
            <path
                d="M 585 194 C 705 178 812 247 851 356 C 895 480 830 584 693 673 C 574 750 488 803 505 872 C 524 949 657 895 748 795 C 845 689 981 697 1055 789 C 1134 887 1103 1043 984 1108 C 889 1161 775 1137 700 1069"
                fill="none"
                stroke="currentColor"
                strokeWidth="135"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M 367 333 C 398 252 463 206 559 193 C 663 178 749 225 790 306 C 835 395 786 493 671 526 C 573 554 459 544 380 505 C 331 481 315 431 345 391 C 352 381 361 359 367 333 Z"
                fill="currentColor"
            />
            <path
                d="M 374 492 C 346 522 316 540 274 548 C 252 552 244 561 244 575 C 244 589 257 596 276 591 C 291 587 309 581 323 574 C 306 594 294 613 292 626 C 290 641 305 650 319 639 C 340 622 361 594 389 552 Z"
                fill="currentColor"
            />
            <circle cx="528" cy="269" r="30" fill="white" stroke="none" />
        </svg>
    );
}
