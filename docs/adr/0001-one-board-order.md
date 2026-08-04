# Use one canonical task order per Board

Boards use one canonical Task sequence shared by List and Phases views. Separate view-specific orders would let the same Board express conflicting priority and make movement semantics harder to understand; Phase lanes instead show ordered subsets of Board Order, so movement in either view updates the same sequence.
