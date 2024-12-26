import { createPaginationDto } from "@/common/dtos";
import { Amenity } from "../models";

export class AmenitiesPaginationResultDto extends createPaginationDto(Amenity) {}