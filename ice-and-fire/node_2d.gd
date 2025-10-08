extends Node2D

# Define map dimensions
const MAP_WIDTH = 20
const MAP_HEIGHT = 20

# Define tile sizes
const TILE_SIZE = 32

# Define tile types (e.g., wall, floor, grass)
enum TileType { WALL, FLOOR, GRASS }

# Create a 2D array to store map data
var map_data = []

func _ready():
	# Initialize map data
	for x in range(MAP_WIDTH):
		map_data.append([])
		for y in range(MAP_HEIGHT):
			if x == 0 || y == 0 || x == MAP_WIDTH - 1 || y == MAP_HEIGHT - 1:
				map_data[x].append(TileType.WALL)
			else:
				map_data[x].append(TileType.FLOOR)

	# Draw the map
	draw_map()

func draw_map():
	for x in range(MAP_WIDTH):
		for y in range(MAP_HEIGHT):
			var tile_type = map_data[x][y]
			var tile_color = get_tile_color(tile_type)
			var tile_position = Vector2(x * TILE_SIZE, y * TILE_SIZE)
			draw_rect(Rect2(tile_position, Vector2(TILE_SIZE, TILE_SIZE)), tile_color)

func get_tile_color(tile_type):
	match tile_type:
		TileType.WALL:
			return Color(1, 0, 0)  # Red
		TileType.FLOOR:
			return Color(1, 1, 0)  # Yellow
		TileType.GRASS:
			return Color(0, 1, 0)  # Green
