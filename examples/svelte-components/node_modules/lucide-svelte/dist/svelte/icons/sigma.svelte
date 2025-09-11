<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M18 7V4H6l6 8-6 8h12v-3" }]];
</script>

<Icon name="sigma" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
